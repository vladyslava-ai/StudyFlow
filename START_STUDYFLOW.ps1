$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host 'Building StudyFlow 2.0...' -ForegroundColor Cyan

Push-Location frontend
try {
    if (-not (Test-Path 'node_modules\vite\bin\vite.js')) {
        npm ci
        if ($LASTEXITCODE -ne 0) {
            throw 'npm install failed'
        }
    }

    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw 'Frontend build failed'
    }
}
finally {
    Pop-Location
}



Push-Location backend
try {
    if (-not (Test-Path '.env')) {
        throw 'Backend .env file is missing'
    }

    if (-not (Test-Path '.venv\Scripts\python.exe')) {
        python -m venv .venv
        & '.\.venv\Scripts\python.exe' -m pip install -r requirements.txt
        if ($LASTEXITCODE -ne 0) {
            throw 'Python dependencies installation failed'
        }
    }

    Write-Host 'Open http://127.0.0.1:8000' -ForegroundColor Green

    & '.\.venv\Scripts\python.exe' -m uvicorn app.main:app --reload
}
finally {
    Pop-Location
}