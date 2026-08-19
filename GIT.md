# Guía rápida de Git

## 1. Clonar un repositorio

## En la carpeta del proyecto
git clone https://github.com/usuario/mi-proyecto.git .

## 2. Crear un nuevo repositorio

git init
git add .
git commit -m "Commit inicial"
git remote add origin https://github.com/usuario/mi-proyecto.git
git branch -M main
git push -u origin main

## 3. Crear una rama

git checkout main
git pull origin main
git checkout -b nombre-rama

## 4. Hacer commit en una rama y push

git checkout nombre-rama
git add .
git commit -m "Descripción del cambio"
git push origin nombre-rama 
(si es el primer push agregar -u: git push -u origin nombre-rama)

## 5. Hacer merge de una rama con main

git checkout main
git pull origin main
git merge nombre-rama
git push origin main
