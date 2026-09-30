!include LogicLib.nsh
!include FileFunc.nsh

; Return 1 for a real file or an unreadable/reparse entry, and 0 for a tree
; containing only ordinary empty directories. Do not follow directory links.
Function SchoolDirectoryContainsFiles
  Exch $R0
  Push $R1
  Push $R2
  Push $R3
  Push $R4
  StrCpy $R4 0
  ClearErrors
  FindFirst $R1 $R2 "$R0\*"
  ${If} ${Errors}
    StrCpy $R4 1
  ${EndIf}
  ${DoWhile} $R2 != ""
    ${If} $R2 != "."
    ${AndIf} $R2 != ".."
      ClearErrors
      ${GetFileAttributes} "$R0\$R2" "DIRECTORY" $R3
      ${If} ${Errors}
        StrCpy $R4 1
        ${Break}
      ${EndIf}
      ${If} $R3 == 1
        ${GetFileAttributes} "$R0\$R2" "REPARSE_POINT" $R3
        ${If} ${Errors}
        ${OrIf} $R3 == 1
          StrCpy $R4 1
          ${Break}
        ${EndIf}
        Push "$R0\$R2"
        Call SchoolDirectoryContainsFiles
        Pop $R3
        ${If} $R3 == 1
          StrCpy $R4 1
          ${Break}
        ${EndIf}
      ${Else}
        StrCpy $R4 1
        ${Break}
      ${EndIf}
    ${EndIf}
    ClearErrors
    FindNext $R1 $R2
    ${If} ${Errors}
      StrCpy $R2 ""
    ${EndIf}
  ${Loop}
  FindClose $R1
  StrCpy $R0 $R4
  Pop $R4
  Pop $R3
  Pop $R2
  Pop $R1
  Exch $R0
FunctionEnd
