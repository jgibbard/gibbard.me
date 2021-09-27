title: Building a Busybox based OS for the DE10 Nano
date: 2021/09/27
description: Instructions for building an compact Linux root file system for the Intel DE10 Nano FPGA SoC development board using Buildroot.
main_image: linux_busybox_de10.svg

## 1.0 Introduction
### Root file system
When the Linux kernel boots it looks for a file named ```/init``` on the root file system, and if it exists it executes it. For a super minimal system you can statically compile any program and as long as its executable is placed at ```/init``` it will be executed; no packages, libraries, or other files / directories are required. Of course one of the main benefits of using the Linux kernel is the huge number of compatible libraries, scripts, and tools available; to take advantage of these you need to build a slightly more complex root file system. The Linux [Filesystem Hierarchy Standard](https://en.wikipedia.org/wiki/Filesystem%5FHierarchy%5FStandard){target="_blank"} details all the directories needed for a full system, however embedded linux systems typically only require a smaller subset. 

### Busybox
It is completely possible to populate the root file system by individually compiling all the desired tools from source, in fact this is precisely what the [Linux From Scratch](https://www.linuxfromscratch.org/){target="_blank"} project does. [Busybox](https://www.busybox.net/){target="_blank"} provides an alternative to this whereby a single executable file (assuming it is statically linked) can be built which contains almost all the common linux tools from ``cd`` to ``vi``. 

### Initial RAM disk
When the Linux Kernel boots you can optionally specify an initial RAM disk which allows a root file system to be loaded into memory. The original intention was for this "temporary" root file system to perform preparations before mounting the main root file system (for example loading kernel modules to talk to complex storage devices), however, in many embedded systems the initial RAM disk is the final root file system.

There are two ways to make a initial RAM disk for the Linux kernel: ```initrd``` and ```initramfs```. With ```initrd``` an image of a file system is supplied and is made available via a special block device. With ```initramfs``` a cpio archive (like tar but simpler) is supplied and the kernel unpacks the archive into a tempfs file system. Both ```initrd``` and ```initramfs``` can be compressed with gzip (or similar) providing the option to decompress the chosen type is enabled in the Linux Kernel. Both RAM disk types can also be optionally built directly into the kernel, resulting in a single binary.

## 2.0 Toolchains, U-Boot, and the Kernel
A Ubuntu 21.04 system was used for this build, but most Linux systems should work fine.

Before building the root file system a cross-compilation toolchain is required, and the kernel and u-boot boot-loader need to be downloaded, configured, and built. 

The procedure to do this is identical to steps 1.0 to 4.0 in the article [Embedded Debian for the DE10 Nano](../linux_debian_de10){target="_blank"}.

Once those steps have been followed the directory structure should look like below:
```
de10
|___toolchain
|___u-boot
|___linux
```

## 3.0 Make a root file system
Make a file in the ```de10``` directory called ```busybox_fs_build.sh``` and copy the following script into the file:

```bash
#!/bin/bash

ROOT=rootfs_busybox
LOCALDIR=$PWD
echo "$LOCALDIR/$ROOT/"

# Clear the root file system every time
if [ -d "$LOCALDIR/$ROOT" ]
then
  echo "Deleting old root file system directory"
  rm -r "$LOCALDIR/$ROOT"
fi

echo "Creating new root file system directory"
# Creates a minimal subset of the Linux FHS
mkdir -p "$LOCALDIR/$ROOT"/{etc/init.d,tmp,proc,sys,dev,home,mnt,root,var} &&
chmod a+rwxt "$LOCALDIR/$ROOT"/tmp &&

# Create the init script
cat > "$LOCALDIR/$ROOT"/etc/init.d/rcS << 'EOF' &&
#!/bin/sh

# mdev is busybox's udev equivalent
mount -t devtmpfs  devtmpfs  /dev || mdev -s
mount -t proc      proc      /proc
mount -t sysfs     sysfs     /sys
mount -t tmpfs     tmpfs     /tmp
# This stops kernel messages from spamming the console
# Use dmesg to see all messages
echo 3 3 > /proc/sys/kernel/printk
EOF

# Init script MUST be executable or the system won't boot
chmod +x "$LOCALDIR/$ROOT"/etc/init.d/rcS &&

# Links busybox init to /init which is called by the kernel
ln -s sbin/init "$LOCALDIR/$ROOT"/init &&
# Alternatively you can just set rdinit=/sbin/init in the kernel parameters

# Set DNS to use google's DNS server
echo "nameserver 8.8.8.8" > "$LOCALDIR/$ROOT"/etc/resolv.conf || exit 1

# If there is no ARM toolchain then download one
if [ ! -d "$LOCALDIR/toolchain" ]
then
  echo "Downloading ARM toolchain" &&
  mkdir toolchain &&
  cd toolchain &&
  wget https://toolchains.bootlin.com/downloads/releases/toolchains/armv7-eabihf/tarballs/armv7-eabihf--glibc--stable-2020.08-1.tar.bz2 &&
  tar -xf armv7-eabihf--glibc--stable-2020.08-1.tar.bz2 &&
  rm armv7-eabihf--glibc--stable-2020.08-1.tar.bz2 || exit 1
fi

echo "Enabling ARM toolchain" &&
cd "$LOCALDIR/toolchain" &&
export CROSS_COMPILE=$PWD/armv7-eabihf--glibc--stable-2020.08-1/bin/arm-linux- || exit 1

# If busybox executable not found then nuke any busybox directory and redownload 
if test -f "$LOCALDIR/busybox/busybox"
then
  echo "Busybox already built"
else
  if [ -d "$LOCALDIR/busybox" ]
  then
    echo "Deleting old busybox directory" &&
    rm -rf "$LOCALDIR/busybox" || exit 1
  fi
  echo "Downloading and building busybox " &&
  cd "$LOCALDIR" &&
  git clone https://github.com/mirror/busybox.git &&
  cd "$LOCALDIR/busybox" &&
  git checkout 1_34_0 &&
  make defconfig &&
  make menuconfig && 
  make -j $(nproc) || exit 1
fi

# Copy the busybox binary to the root file system 
# and generate symbolic links for all the tools that busybox contains.
echo "Installing Busybox into root file system" &&
cd "$LOCALDIR/busybox" &&
make CONFIG_PREFIX="$LOCALDIR/$ROOT" install || exit 1

# Generate initramfs file
echo "Compressing root file system" &&
cd $LOCALDIR/$ROOT &&
find . | cpio -ov --format=newc | gzip -9 >../initramfs.cpio.gz &&
echo "Root file system created"  &&
cd $LOCALDIR || exit 1
```

The script generates a skeleton root file system, downloads a toolchain if required, downloads and builds busybox if required, adds an initialisation script, and then finally generates a compressed cpio archive containing the roof file system.

The following commands will run the script:

```bash
# cd to de10 directory
chmod +x busybox_fs_build.sh
./busybox_fs_build.sh
```

Part way through it will pop up with the menuconfig for busybox. 

Select ```Settings```, scroll to the ```--- Build Options``` section and select
```Build static binary (no shared libs)```, press ```y``` to enable the option (shows as ```[*]```), then select ```Exit```, ```Exit```, ```Yes```. The build should continue.

## 4.0 Using QEMU to test the system (Optional)
This step can be skipped, however it can sometimes be useful to test the system on the development machine, rather than the target hardware.

Using ```qemu-user-static``` (allows the execution of binaries for different architectures) and ```systemd-nspawn``` (like chroot, but with more isolation from the host system) a root file system created for an ARM architecture can be executed on an x86_64 host system. NB. this uses the host's Linux kernel and not the cross compiled one.

### Install prerequisites 
```bash
sudo apt install qemu-user-static systemd-container
```

### Launch container 
```bash
# cd to de10 directory
sudo systemd-nspawn -D ./rootfs_busybox/
```
The container will run. Type ```exit``` to stop the container when done.

If any changes are made to the file system, then the "Compressing root file system" section of the ```busybox_fs_build.sh``` script should be rerun to generate the initramfs archive again.

## 5.0 Create the SD card image
### Create a blank image file

Make a file in the ```de10``` directory called ```busybox_image_build.sh``` and copy the following script into the file:

```bash
#!/bin/bash

echo "Create 32 MiB image" &&
sudo dd if=/dev/zero of=de10_nano_sd_busybox.img bs=32M count=1 &&
echo "Connect image it as a loop device." &&
loop_device=$(sudo losetup --show -f de10_nano_sd_busybox.img) || exit 1

echo "Create partitions."
echo "1M for U-boot, and rest of space for kernel and initramfs"
(
echo n; echo p; echo 2; echo; echo +1M;   echo t; echo a2; # Make the U-Boot partition
echo n; echo p; echo 1; echo; echo; echo t; echo 1; echo b;  # Make kernel / initramfs partition
echo w; # Write the changes
) | sudo fdisk "$loop_device"  >> /dev/null

echo "Above error can be ignored (Re-reading the partition table failed)" &&
sudo partprobe "$loop_device" &&

echo "Make FAT filesystem" &&
sudo mkfs -t vfat "$loop_device""p1" &&

echo "Copy over U-Boot" &&
sudo dd if=./u-boot/u-boot-with-spl.sfp of="$loop_device""p2" bs=64k seek=0 oflag=sync || exit 1

if [ ! -d fat ]
then
  mkdir fat
fi

echo "Mount FAT file system" &&
sudo mount "$loop_device""p1" fat &&
echo "Copy kernel" &&
sudo cp linux/arch/arm/boot/zImage fat &&
# Use DE0 DTB for now as no DE10 DTB and they are basically the same board
echo "Copy device tree" &&
sudo cp linux/arch/arm/boot/dts/socfpga_cyclone5_de0_nano_soc.dtb fat &&
echo "Copy initramfs" &&
sudo cp initramfs.cpio.gz fat || exit 1

echo "Generate extlinux.conf file" &&
echo "LABEL Linux Default" > extlinux.conf &&
echo "    KERNEL ../zImage" >> extlinux.conf &&
echo "    FDT ../socfpga_cyclone5_de0_nano_soc.dtb" >> extlinux.conf &&
echo "    APPEND initrd=../initramfs.cpio.gz root=/dev/ram earlyprintk console=ttyS0,115200n8" >> extlinux.conf &&
sudo mkdir -p fat/extlinux &&
sudo cp extlinux.conf fat/extlinux || exit 1
echo "Unmount and clean up" &&
sudo umount fat &&
rm extlinux.conf &&
sudo losetup -d "$loop_device" || exit 1
echo "Done!"
```

The script creates a disk image, partitions it, copies over U-Boot, formats a FAT partition, copies over the kernel, device tree, and initramfs archive, and finally generates an extlinux.conf file.

The following commands will run the script:

```bash
# cd to de10 directory
chmod +x busybox_image_build.sh
./busybox_image_build.sh
```

## 6.0 Write the image to an SD card
Remember to change /dev/sdX to the right value for your SD card!
```bash
# cd to de10 directory
sudo dd if=de10_nano_sd_busybox.img of=/dev/sdX bs=64K status=progress
sync
```

Pop the SD card into the DE10 nano, and it should boot up into the busybox shell!