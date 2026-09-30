Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batchPath = scriptDir & "\start_dev.bat"

If Not fso.FileExists(batchPath) Then
    MsgBox "start_dev.bat not found." & vbCrLf & batchPath, vbExclamation, "E-System School"
    WScript.Quit 1
End If

shell.Run Chr(34) & batchPath & Chr(34), 0, False
