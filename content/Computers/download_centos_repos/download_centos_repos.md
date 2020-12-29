title: Download a local copy of the CentOS 7 repositories
date: 2019/11/10
description: Instructions for downloading a local copy of the CentOS 7 repositories. This is useful when you have an isolated development network or many local clients requiring updates.
main_image: centos.svg

# Downloading CentOS 7 repositories
Having a local copy of the yum repositories for CentOS can be useful when you have an isolated development network or many local clients requiring updates.

The following script will download a full copy of all the packages available in the normal CentOS 7 and EPEL repositories. At time of writing the current size is about 46 GB.

```sh
mkdir -p repos/centos/7/os/
mkdir -p repos/centos/7/updates/
mkdir -p repos/epel/7/x86_64/

rsync -avz -avz --delete rsync://mirror.bytemark.co.uk/centos/7/os/x86_64/ ./repos/centos/7/os/
rsync -avz -avz --delete rsync://mirror.bytemark.co.uk/centos/7/updates/x86_64/ ./repos/centos/7/updates/
rsync -avz -avz --delete rsync://mirror.bytemark.co.uk/fedora/epel/7/x86_64/ ./repos/epel/7/x86_64/
```