; Custom storage pages and update-safe data handling for the electron-builder NSIS installer.
!include LogicLib.nsh

!ifndef BUILD_UNINSTALLER
!define MUI_INSTFILESPAGE_COLORS "0369A1 F0F9FF"
!endif

; This runs before electron-builder invokes the previous version's uninstaller.
; The old uninstaller removes $INSTDIR recursively, so move school data out first.
!ifndef BUILD_UNINSTALLER
!include "${__FILEDIR__}\storage-directory.nsh"
Var StorageConfigPath
Var DataSettingsRepointed
Var ReceiptSettingsRepointed
Var ExistingInstallation
Var ExistingInstallDirectory

!macro customInit
  ; Show real extraction progress even when an older updater passes /S.
  ; Existing-location and finish hooks keep this visible flow automatic.
  ${If} ${isUpdated}
    SetSilent normal
    SetAutoClose true
  ${EndIf}
  ; Treat a manually launched installer over an existing installation as an
  ; update too by checking the location saved by the install-mode initializer.
  StrCpy $ExistingInstallation "0"
  ReadRegStr $0 HKCU "Software\${APP_GUID}" InstallLocation
  ReadRegStr $1 HKLM "Software\${APP_GUID}" InstallLocation
  ${If} $0 != ""
  ${AndIf} $1 != ""
    MessageBox MB_ICONSTOP|MB_OK "พบการติดตั้งทั้งแบบผู้ใช้ปัจจุบันและทุกผู้ใช้ กรุณาติดต่อผู้ดูแลก่อนอัปเดต ระบบหยุดโดยไม่เปลี่ยนแปลงข้อมูล"
    Abort
  ${EndIf}
  ${If} $0 != ""
  ${OrIf} $1 != ""
    StrCpy $ExistingInstallation "1"
    ${If} ${isUpdated}
      ; initMultiUser already honors /D= from the running app.
      StrCpy $ExistingInstallDirectory "$INSTDIR"
    ${Else}
      StrCpy $ExistingInstallDirectory "$0"
      ${If} $ExistingInstallDirectory == ""
        StrCpy $ExistingInstallDirectory "$1"
      ${EndIf}
    ${EndIf}
    StrCpy $INSTDIR "$ExistingInstallDirectory"
  ${ElseIf} ${isUpdated}
    ; The updater passes the running executable's parent through /D=.
    ${IfNot} ${FileExists} "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
      MessageBox MB_ICONSTOP|MB_OK "ไม่พบตำแหน่งโปรแกรมเดิม ยกเลิกการอัปเดตโดยไม่เปลี่ยนแปลงข้อมูล"
      Abort
    ${EndIf}
    StrCpy $ExistingInstallation "1"
    StrCpy $ExistingInstallDirectory "$INSTDIR"
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

    ; Empty subdirectories are not school records. Preserve an empty backup
    ; under a separate name rather than mistaking it for conflicting data.
    ${If} ${FileExists} "$INSTDIR\..\E-System School Update Backup"
      Push "$INSTDIR\..\E-System School Update Backup"
      Call SchoolDirectoryContainsFiles
      Pop $0
      ${If} $0 == 0
        System::Call 'kernel32::GetTickCount() i .r0'
        ClearErrors
        Rename "$INSTDIR\..\E-System School Update Backup" "$INSTDIR\..\E-System School Empty Backup-$0"
        ${If} ${Errors}
          MessageBox MB_ICONSTOP|MB_OK "เก็บโฟลเดอร์สำรองว่างไม่สำเร็จ ระบบหยุดโดยไม่ลบข้อมูล"
          Abort
        ${EndIf}
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
  Page custom InstallDirectoryPageCreate InstallDirectoryPageLeave
  Function SchoolInstallProgressShow
    ${If} $ExistingInstallation == "1"
      !insertmacro MUI_HEADER_TEXT "กำลังติดตั้งอัปเดต ${VERSION}" "กำลังติดตั้งไฟล์ใหม่และคืนข้อมูลเดิม กรุณารอ โปรแกรมจะเปิดใหม่โดยอัตโนมัติ"
      GetDlgItem $0 $HWNDPARENT 2
      EnableWindow $0 0
      System::Call 'user32::GetSystemMenu(p $HWNDPARENT, i 0) p .r0'
      System::Call 'user32::EnableMenuItem(p r0, i 0xF060, i 1)'
      BringToFront
    ${EndIf}
  FunctionEnd
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW SchoolInstallProgressShow
!macroend

!macro customFinishPage
  Function StartApp
    ${If} $ExistingInstallation == "1"
      StrCpy $1 "--updated"
    ${Else}
      StrCpy $1 ""
    ${EndIf}
    ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
  FunctionEnd

  Function SchoolFinishPagePre
    ${If} $ExistingInstallation == "1"
      !insertmacro MUI_HEADER_TEXT "อัปเดต ${VERSION} สำเร็จ" "ข้อมูลเดิมพร้อมใช้งาน กำลังเปิด E-System School ใหม่"
      Sleep 1200
      Call StartApp
      Quit
    ${EndIf}
  FunctionEnd
  !define MUI_PAGE_CUSTOMFUNCTION_PRE SchoolFinishPagePre
  !define MUI_FINISHPAGE_RUN
  !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !insertmacro MUI_PAGE_FINISH
!macroend

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
  ; Page custom does not consume MUI_PAGE_CUSTOMFUNCTION_PRE. Skip it here.
  ${If} $ExistingInstallation == "1"
    StrCpy $INSTDIR "$ExistingInstallDirectory"
    Abort
  ${EndIf}
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
  ${If} ${isUpdated}
    !insertmacro MUI_HEADER_TEXT "กำลังคืนข้อมูลสำหรับเวอร์ชัน ${VERSION}" "ติดตั้งไฟล์ใหม่แล้ว กำลังคืน Data และ Receipts เดิม กรุณารอ"
  ${EndIf}
  ${If} $ExistingInstallation != "1"
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
