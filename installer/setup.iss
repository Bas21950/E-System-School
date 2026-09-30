; setup.iss
; Inno Setup script for E-System School

[Setup]
AppName=E-System School
AppVersion=1.2.5
DefaultDirName={autopf}\E-System School
DefaultGroupName=E-System School
AllowNoIcons=yes
OutputDir=.
OutputBaseFilename=E-System-School-Setup
SetupIconFile=app_icon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "thai"; MessagesFile: "compiler:Languages\Thai.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Dirs]
Name: "{app}"; Permissions: users-modify

[Files]
; Copy main application files
Source: "..\backend\*"; DestDir: "{app}\backend"; Flags: recursesubdirs createallsubdirs; Excludes: "node_modules,dist,.env,php-receipt\vendor"
Source: "..\frontend\*"; DestDir: "{app}\frontend"; Flags: recursesubdirs createallsubdirs; Excludes: "node_modules,.next,.env.local"
Source: "..\shell\*"; DestDir: "{app}\shell"; Flags: recursesubdirs createallsubdirs; Excludes: "node_modules"
Source: "..\database\*"; DestDir: "{app}\database"; Flags: recursesubdirs createallsubdirs
Source: "..\start_system.bat"; DestDir: "{app}"
Source: "..\setup_system.bat"; DestDir: "{app}"
Source: "..\E-System School.vbs"; DestDir: "{app}"
Source: "..\start_services.bat"; DestDir: "{app}"
Source: "app_icon.ico"; DestDir: "{app}"; Flags: ignoreversion

; Include prerequisite installers
Source: "node-v20.12.2-x64.msi"; DestDir: "{tmp}"; Flags: deleteafterinstall
Source: "postgresql-16.2-1-windows-x64.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

; Include post-install helper
Source: "post_install.bat"; DestDir: "{app}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\E-System School"; Filename: "{app}\E-System School.vbs"; WorkingDir: "{app}"; IconFilename: "{app}\app_icon.ico"
Name: "{group}\{cm:UninstallProgram,E-System School}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\E-System School"; Filename: "{app}\E-System School.vbs"; WorkingDir: "{app}"; Tasks: desktopicon; IconFilename: "{app}\app_icon.ico"

[Run]
; 1. Install Node.js if not present
Filename: "msiexec.exe"; Parameters: "/i ""{tmp}\node-v20.12.2-x64.msi"" /passive /norestart"; StatusMsg: "Installing Node.js (LTS)..."; Check: NeedsNode

; 2. Install PostgreSQL if not present
Filename: "{tmp}\postgresql-16.2-1-windows-x64.exe"; Parameters: "--mode unattended --unattendedmodeui minimal --superpassword ""postgres"" --serverport 5432"; StatusMsg: "Installing PostgreSQL database server... (This may take a minute)"; Check: NeedsPostgres

; 3. Run post-installation script to install npm packages and initialize DB
Filename: "{app}\post_install.bat"; Parameters: """{code:GetDataDirectory}"" ""{code:GetReceiptDirectory}"""; StatusMsg: "Configuring system dependencies and database schema..."; Flags: runhidden waituntilterminated

; 4. Launch the desktop app once setup is complete
Filename: "{app}\E-System School.vbs"; Description: "Launch E-System School"; Flags: postinstall nowait skipifsilent shellexec

[Code]
var
  DataDirectoryPage: TInputDirWizardPage;

procedure InitializeWizard;
begin
  DataDirectoryPage := CreateInputDirPage(wpSelectDir,
    'เลือกที่เก็บข้อมูลโรงเรียน',
    'กำหนดโฟลเดอร์หลักสำหรับข้อมูลและใบเสร็จ',
    'ระบบจะสร้างโฟลเดอร์ Data และ Receipts ให้เองภายในตำแหน่งนี้ และจะไม่ลบโฟลเดอร์นี้เมื่อถอนการติดตั้ง',
    False, '');
  DataDirectoryPage.Add('โฟลเดอร์หลักเก็บข้อมูลโรงเรียน:');
  DataDirectoryPage.Values[0] := ExpandConstant('{localappdata}\E-System School');
end;

function GetDataDirectory(Param: String): String;
begin
  Result := AddBackslash(DataDirectoryPage.Values[0]) + 'Data';
end;

function GetReceiptDirectory(Param: String): String;
begin
  Result := AddBackslash(DataDirectoryPage.Values[0]) + 'Receipts';
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if (CurPageID = DataDirectoryPage.ID) and (Trim(DataDirectoryPage.Values[0]) = '') then begin
    MsgBox('กรุณาเลือกโฟลเดอร์เก็บข้อมูลโรงเรียน', mbError, MB_OK);
    Result := False;
  end;
end;

function NeedsNode: Boolean;
var
  ResultCode: Integer;
begin
  Result := (not Exec('cmd.exe', '/c node -v', '', SW_HIDE, ewWaitUntilTerminated, ResultCode)) or (ResultCode <> 0);
end;

function PostgresBinaryExists: Boolean;
begin
  Result :=
    FileExists('C:\Program Files\PostgreSQL\16\bin\psql.exe') or
    FileExists('C:\Program Files\PostgreSQL\15\bin\psql.exe') or
    FileExists('C:\Program Files\PostgreSQL\14\bin\psql.exe') or
    FileExists('C:\Program Files\PostgreSQL\13\bin\psql.exe') or
    FileExists(ExpandConstant('{pf}\PostgreSQL\16\bin\psql.exe')) or
    FileExists(ExpandConstant('{pf}\PostgreSQL\15\bin\psql.exe')) or
    FileExists(ExpandConstant('{pf}\PostgreSQL\14\bin\psql.exe')) or
    FileExists(ExpandConstant('{pf}\PostgreSQL\13\bin\psql.exe'));
end;

function ServiceExists(ServiceName: string): Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('sc.exe', 'query ' + ServiceName, '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

function PostgresServiceExists: Boolean;
begin
  Result :=
    ServiceExists('postgresql-x64-16') or
    ServiceExists('postgresql-x64-15') or
    ServiceExists('postgresql-x64-14') or
    ServiceExists('postgresql-x64-13');
end;

function NeedsPostgres: Boolean;
begin
  Result := not (PostgresBinaryExists or PostgresServiceExists);
end;
