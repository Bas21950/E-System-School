; Custom storage pages and update-safe data handling for the electron-builder NSIS installer.
!include LogicLib.nsh

; This runs before electron-builder invokes the previous version's uninstaller.
; The old uninstaller removes $INSTDIR recursively, so move school data out first.
!ifndef BUILD_UNINSTALLER
Var StorageConfigPath
Var DataSettingsRepointed
Var ReceiptSettingsRepointed
Var ExistingInstallation

!macro customInit
  ; Treat a manually launched installer over an existing installation as an
  ; update too by checking the location saved by the install-mode initializer.
  StrCpy $ExistingInstallation "0"
  ReadRegStr $0 SHELL_CONTEXT "Software\${APP_GUID}" InstallLocation
  ${If} $0 != ""
    StrCpy $INSTDIR $0
    StrCpy $ExistingInstallation "1"
  ${EndIf}
  ${If} $ExistingInstallation == "1"
    StrCpy $DataSettingsRepointed "0"
    StrCpy $ReceiptSettingsRepointed "0"
    ${If} ${FileExists} "$LOCALAPPDATA\E-System School\install-settings.ini"
      StrCpy $StorageConfigPath "$LOCALAPPDATA\E-System School\install-settings.ini"
    ${Else}
      ReadEnvStr $0 "ProgramData"
      StrCpy $StorageConfigPath "$0\E-System School\install-settings.ini"
      ${IfNot} ${FileExists} "$StorageConfigPath"
        StrCpy $StorageConfigPath ""
      ${EndIf}
    ${EndIf}

    ; If setup is retried after an interruption, settings may already point
    ; to the sibling backup. Remember that so success can restore the setting.
    ${If} $StorageConfigPath != ""
      ReadINIStr $0 "$StorageConfigPath" "storage" "dataDirectory"
      ${If} $0 == "$INSTDIR\Data"
      ${OrIf} $0 == "$INSTDIR\..\E-System School Update Backup\Data"
        StrCpy $DataSettingsRepointed "1"
      ${EndIf}
      ReadINIStr $0 "$StorageConfigPath" "storage" "receiptDirectory"
      ${If} $0 == "$INSTDIR\Receipts"
      ${OrIf} $0 == "$INSTDIR\..\E-System School Update Backup\Receipts"
        StrCpy $ReceiptSettingsRepointed "1"
      ${EndIf}
    ${EndIf}

    ; If a previous attempt was interrupted, keep its backup and let the
    ; application continue using it. Never overwrite a non-empty backup.
    ${If} ${FileExists} "$INSTDIR\Data\*.*"
      ${If} ${FileExists} "$INSTDIR\..\E-System School Update Backup\Data\*.*"
        MessageBox MB_ICONSTOP|MB_OK "พบข้อมูลทั้งในโฟลเดอร์ Data และโฟลเดอร์สำรอง กรุณาติดต่อผู้ดูแล ระบบยกเลิกการอัปเดตและไม่ได้ลบข้อมูล"
        Abort
      ${EndIf}
    ${EndIf}
    ${If} ${FileExists} "$INSTDIR\Receipts\*.*"
      ${If} ${FileExists} "$INSTDIR\..\E-System School Update Backup\Receipts\*.*"
        MessageBox MB_ICONSTOP|MB_OK "พบข้อมูลทั้งในโฟลเดอร์ Receipts และโฟลเดอร์สำรอง กรุณาติดต่อผู้ดูแล ระบบยกเลิกการอัปเดตและไม่ได้ลบข้อมูล"
        Abort
      ${EndIf}
    ${EndIf}

    ${If} ${FileExists} "$INSTDIR\Data\*.*"
    ${OrIf} ${FileExists} "$INSTDIR\Receipts\*.*"
      CreateDirectory "$INSTDIR\..\E-System School Update Backup"
    ${EndIf}

    ; Remove only empty destination folders left by an interrupted attempt.
    ${If} ${FileExists} "$INSTDIR\..\E-System School Update Backup\Data"
      ${IfNot} ${FileExists} "$INSTDIR\..\E-System School Update Backup\Data\*.*"
        RMDir "$INSTDIR\..\E-System School Update Backup\Data"
      ${EndIf}
    ${EndIf}
    ${If} ${FileExists} "$INSTDIR\..\E-System School Update Backup\Receipts"
      ${IfNot} ${FileExists} "$INSTDIR\..\E-System School Update Backup\Receipts\*.*"
        RMDir "$INSTDIR\..\E-System School Update Backup\Receipts"
      ${EndIf}
    ${EndIf}

    ${If} ${FileExists} "$INSTDIR\Data\*.*"
      ClearErrors
      Rename "$INSTDIR\Data" "$INSTDIR\..\E-System School Update Backup\Data"
      ${If} ${Errors}
        MessageBox MB_ICONSTOP|MB_OK "สำรองโฟลเดอร์ Data ไม่สำเร็จ ยกเลิกการอัปเดตเพื่อป้องกันข้อมูลสูญหาย"
        Abort
      ${EndIf}
      ${If} $DataSettingsRepointed == "1"
        WriteINIStr "$StorageConfigPath" "storage" "dataDirectory" "$INSTDIR\..\E-System School Update Backup\Data"
      ${EndIf}
    ${EndIf}

    ${If} ${FileExists} "$INSTDIR\Receipts\*.*"
      ClearErrors
      Rename "$INSTDIR\Receipts" "$INSTDIR\..\E-System School Update Backup\Receipts"
      ${If} ${Errors}
        MessageBox MB_ICONSTOP|MB_OK "สำรองโฟลเดอร์ Receipts ไม่สำเร็จ ยกเลิกการอัปเดตเพื่อป้องกันข้อมูลสูญหาย"
        Abort
      ${EndIf}
      ${If} $ReceiptSettingsRepointed == "1"
        WriteINIStr "$StorageConfigPath" "storage" "receiptDirectory" "$INSTDIR\..\E-System School Update Backup\Receipts"
      ${EndIf}
    ${EndIf}
  ${EndIf}
!macroend
!endif

!ifndef BUILD_UNINSTALLER
!include nsDialogs.nsh
!include MUI2.nsh

Var DataDirectory
Var InstallDirectoryInput
Var InstallDirectoryBrowseButton

!macro customPageAfterChangeDir
  !define MUI_PAGE_CUSTOMFUNCTION_PRE SkipInstallDirectoryPageIfInstalled
  Page custom InstallDirectoryPageCreate InstallDirectoryPageLeave
!macroend

Function SkipInstallDirectoryPageIfInstalled
  ; initMultiUser has already selected the previous installation scope. Keep
  ; its registered path and don't ask users to select a new folder on upgrades.
  ReadRegStr $DataDirectory SHELL_CONTEXT "Software\${APP_GUID}" InstallLocation
  ${If} $DataDirectory != ""
    StrCpy $INSTDIR $DataDirectory
    Abort
  ${EndIf}
FunctionEnd

; The selected system folder contains the application and all school files.
; Data and Receipts are subfolders, so their contents are kept separately from
; the executable during updates.
Function NormaliseSystemDirectory
  StrCpy $0 $DataDirectory 1 -1
  ${If} $0 == "\"
    StrCpy $DataDirectory $DataDirectory -1
  ${EndIf}
  StrCpy $1 $DataDirectory 15 -15
  ${If} $1 != "E-System School"
    StrCpy $DataDirectory "$DataDirectory\E-System School"
  ${EndIf}
FunctionEnd

Function InstallDirectoryPageCreate
  StrCpy $DataDirectory "$LOCALAPPDATA\E-System School"
  !insertmacro MUI_HEADER_TEXT "ตำแหน่งระบบ" "เลือกโฟลเดอร์หลักสำหรับ E-System School"
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  ${NSD_CreateLabel} 0 0 100% 28u "ระบบจะติดตั้งโปรแกรม พร้อมสร้าง Data และ Receipts ให้เองภายในตำแหน่งนี้"
  Pop $0
  ${NSD_CreateDirRequest} 0 36u 100% 12u "$DataDirectory"
  Pop $InstallDirectoryInput
  ${NSD_CreateBrowseButton} 0 56u 34% 14u "เลือกโฟลเดอร์แม่..."
  Pop $InstallDirectoryBrowseButton
  ${NSD_OnClick} $InstallDirectoryBrowseButton InstallDirectoryBrowse
  nsDialogs::Show
FunctionEnd

Function InstallDirectoryBrowse
  nsDialogs::SelectFolderDialog "เลือกโฟลเดอร์แม่สำหรับระบบ" "$DataDirectory"
  Pop $0
  ${If} $0 != error
    StrCpy $DataDirectory "$0"
    Call NormaliseSystemDirectory
    ${NSD_SetText} $InstallDirectoryInput $DataDirectory
  ${EndIf}
FunctionEnd

Function InstallDirectoryPageLeave
  ${NSD_GetText} $InstallDirectoryInput $DataDirectory
  ${If} $DataDirectory == ""
    MessageBox MB_ICONEXCLAMATION|MB_OK "กรุณาเลือกโฟลเดอร์สำหรับติดตั้งระบบ"
    Abort
  ${EndIf}
  Call NormaliseSystemDirectory
  StrCpy $INSTDIR "$DataDirectory"
  CreateDirectory "$INSTDIR"
  CreateDirectory "$DataDirectory\Data"
  CreateDirectory "$DataDirectory\Receipts"
FunctionEnd

!macro customInstall
  ${IfNot} ${isUpdated}
    CreateDirectory "$INSTDIR"
    CreateDirectory "$INSTDIR\Data"
    CreateDirectory "$INSTDIR\Receipts"
    CreateDirectory "$LOCALAPPDATA\E-System School"
    WriteINIStr "$LOCALAPPDATA\E-System School\install-settings.ini" "storage" "dataDirectory" "$INSTDIR\Data"
    WriteINIStr "$LOCALAPPDATA\E-System School\install-settings.ini" "storage" "receiptDirectory" "$INSTDIR\Receipts"
  ${Else}
    CreateDirectory "$INSTDIR"
    ${If} ${FileExists} "$INSTDIR\..\E-System School Update Backup\Data\*.*"
      ClearErrors
      Rename "$INSTDIR\..\E-System School Update Backup\Data" "$INSTDIR\Data"
      ${If} ${Errors}
        MessageBox MB_ICONSTOP|MB_OK "ติดตั้งโปรแกรมแล้ว แต่คืนข้อมูล Data ไม่สำเร็จ ข้อมูลสำรองยังอยู่ที่โฟลเดอร์ E-System School Update Backup กรุณาติดต่อผู้ดูแลก่อนเปิดใช้งาน"
        Abort
      ${EndIf}
      ${If} $DataSettingsRepointed == "1"
        WriteINIStr "$StorageConfigPath" "storage" "dataDirectory" "$INSTDIR\Data"
      ${EndIf}
    ${Else}
      CreateDirectory "$INSTDIR\Data"
      ${If} $DataSettingsRepointed == "1"
        WriteINIStr "$StorageConfigPath" "storage" "dataDirectory" "$INSTDIR\Data"
      ${EndIf}
    ${EndIf}

    ${If} ${FileExists} "$INSTDIR\..\E-System School Update Backup\Receipts\*.*"
      ClearErrors
      Rename "$INSTDIR\..\E-System School Update Backup\Receipts" "$INSTDIR\Receipts"
      ${If} ${Errors}
        MessageBox MB_ICONSTOP|MB_OK "ติดตั้งโปรแกรมแล้ว แต่คืนข้อมูล Receipts ไม่สำเร็จ ข้อมูลสำรองยังอยู่ที่โฟลเดอร์ E-System School Update Backup กรุณาติดต่อผู้ดูแลก่อนเปิดใช้งาน"
        Abort
      ${EndIf}
      ${If} $ReceiptSettingsRepointed == "1"
        WriteINIStr "$StorageConfigPath" "storage" "receiptDirectory" "$INSTDIR\Receipts"
      ${EndIf}
    ${Else}
      CreateDirectory "$INSTDIR\Receipts"
      ${If} $ReceiptSettingsRepointed == "1"
        WriteINIStr "$StorageConfigPath" "storage" "receiptDirectory" "$INSTDIR\Receipts"
      ${EndIf}
    ${EndIf}

    RMDir "$INSTDIR\..\E-System School Update Backup"
  ${EndIf}
!macroend
!endif
