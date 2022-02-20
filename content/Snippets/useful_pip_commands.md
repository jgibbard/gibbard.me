title: Useful pip commands
date: 2022/02/06

#### Install from a .whl file
```bash
python -m pip install file.whl
```

#### Install from a git repository 
```bash
# Repo is python package
pip install git+https://url_of_repo.git
# Repo contains python package in subdirectory
pip install git+https://url_of_repo.git#subdirectory=path/to/python/setup/file
```

#### Download package and dependencies
The following commands download a python package and all it's dependencies into the directory the command is run from.
```bash
# Downloads package for python version installed on the local machine
pip download <package_name>

# Download matplotlib for Python 2.7 on Windows
pip download matplotlib --only-binary=:all: --python-version 2.7 --platform win_amd64

# Download matplotlib for Python 3.9 on Linux
pip download matplotlib --only-binary=:all: --python-version 3.9 --platform manylinux1_x86_64
# Info about manylinux here: https://github.com/pypa/manylinux
```