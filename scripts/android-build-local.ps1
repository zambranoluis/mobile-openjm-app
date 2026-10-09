param([ValidateSet('x86_64','arm64-v8a')][string]$Architecture='x86_64', [switch]$Bundled)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$projectName=Split-Path -Leaf $projectRoot
$projectParent=Split-Path -Parent $projectRoot
if(-not $env:ANDROID_HOME){$env:ANDROID_HOME=Join-Path $env:LOCALAPPDATA 'Android/Sdk'}
if(-not (Test-Path (Join-Path $env:ANDROID_HOME 'platform-tools/adb.exe'))){throw 'Configure ANDROID_HOME with an installed Android SDK.'}
if(-not $env:JAVA_HOME){$env:JAVA_HOME='C:/Program Files/Android/Android Studio/jbr'}
if(-not (Test-Path (Join-Path $env:JAVA_HOME 'bin/java.exe'))){throw 'Configure JAVA_HOME with a compatible Android build JDK (tested: Java 21).'}
Push-Location $projectRoot
$buildDrive=$null
$previousAutolinking=$env:OPENJM_LOCAL_AUTOLINKING_CONFIG
try {
    & npx expo config --type public --json | Out-Null
    if($LASTEXITCODE -ne 0){throw 'Expo configuration failed.'}
    if(-not (Test-Path 'android/gradlew.bat')){
        & npx expo prebuild --platform android --no-install
        if($LASTEXITCODE -ne 0){throw 'Native generation failed.'}
    }
    $buildDrive=@('O','P','Q','R','S','T','U','V','W','X','Y','Z') | Where-Object { -not (Test-Path "${_}:/") } | Select-Object -First 1
    if(-not $buildDrive){throw 'No unused drive letter is available for a short build path.'}
    & subst "${buildDrive}:" $projectParent
    if($LASTEXITCODE -ne 0){$buildDrive=$null;throw 'Could not create a temporary build alias.'}
    Push-Location "${buildDrive}:/$projectName/android"
    try {
        & node ../scripts/android-autolinking.cjs "${buildDrive}:/$projectName" $projectRoot
        if($LASTEXITCODE -ne 0){throw 'Native autolinking generation failed.'}
        $env:OPENJM_LOCAL_AUTOLINKING_CONFIG="${buildDrive}:/$projectName/.expo/local-android/autolinking.json"
        $settingsPath=Join-Path (Get-Location) 'settings.gradle'
        $settingsText=[IO.File]::ReadAllText($settingsPath)
        if(-not $settingsText.Contains('OPENJM_LOCAL_AUTOLINKING_CONFIG')) {
            $anchor="if (System.getenv('EXPO_USE_COMMUNITY_AUTOLINKING') == '1') {"
            if(-not $settingsText.Contains($anchor)){throw 'Expo settings template changed; review local autolinking adaptation.'}
            $replacement="if (System.getenv('OPENJM_LOCAL_AUTOLINKING_CONFIG') != null) {`n    ex.autolinkLibrariesFromConfigFile(new File(System.getenv('OPENJM_LOCAL_AUTOLINKING_CONFIG')))`n  } else $anchor"
            [IO.File]::WriteAllText($settingsPath,$settingsText.Replace($anchor,$replacement))
        }
        $buildTask=if($Bundled){'assembleRelease'}else{'assembleDebug'}
        & ./gradlew.bat $buildTask --no-daemon --max-workers=2 -I ../scripts/android-local.init.gradle '-Dorg.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=512m' "-PreactNativeArchitectures=$Architecture" "-PopenjmNativeBuildSlot=$buildDrive-$Architecture"
        if($LASTEXITCODE -ne 0){throw 'Android build failed; see Gradle output.'}
    } finally { Pop-Location }
} finally {
    $env:OPENJM_LOCAL_AUTOLINKING_CONFIG=$previousAutolinking
    if($buildDrive){
        $aliases=& subst
        $expected="${buildDrive}:\: => $projectParent"
        if($aliases -contains $expected){& subst "${buildDrive}:" /D}
        else {Write-Warning 'Alias ownership changed; leave it for manual review.'}
    }
    Pop-Location
}
