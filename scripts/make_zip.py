import os
import shutil
import zipfile

def build_zip():
    zip_filename = 'homebased-services-project.zip'
    exclude_dirs = {'node_modules', '.git', 'dist', '.aistudio', '__pycache__'}
    exclude_files = {zip_filename, 'bun.lock'}

    os.makedirs('public', exist_ok=True)

    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk('.'):
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
            for file in files:
                if file in exclude_files or file.endswith('.zip'):
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, '.')
                zf.write(file_path, rel_path)

    shutil.copyfile(zip_filename, os.path.join('public', zip_filename))
    size_mb = os.path.getsize(zip_filename) / (1024 * 1024)
    print(f"Successfully generated {zip_filename} ({size_mb:.2f} MB)")

if __name__ == '__main__':
    build_zip()
