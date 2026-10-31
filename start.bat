@echo off
title OptiPic — Kompresor Gambar Privat
echo ========================================================
echo   OptiPic — Kompresor & Konverter Gambar Privat (Local Server)
echo ========================================================
echo.
echo Membuka OptiPic di browser Anda...
echo Alamat: http://localhost:8000
echo.
echo Tekan Ctrl+C untuk menutup server.
echo ========================================================
echo.
start http://localhost:8000
python -m http.server 8000
pause
