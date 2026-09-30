Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batchPath = scriptDir & "\launch_setup_fast.bat"

If Not fso.FileExists(batchPath) Then
    MsgBox "launch_setup_fast.bat not found." & vbCrLf & batchPath, vbExclamation, "E-System School"
    WScript.Quit 1
End If

' Run hidden so users do not see a console window.
shell.Run Chr(34) & batchPath & Chr(34), 0, False
