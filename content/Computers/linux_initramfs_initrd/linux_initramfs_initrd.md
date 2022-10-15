title: Working with Linux Initial RAM Disks
date: 2021/10/23
description: A short reference guide to generating and modifying initrd and initramfs initial RAM disks.
main_image: linux_initramfs_initrd.svg

## Introduction
When the Linux Kernel boots you can optionally specify an initial RAM disk which allows a root file system to be loaded into memory. The original intention was for this "temporary" root file system to perform preparations before mounting the main root file system (for example loading kernel modules to talk to complex storage devices), however, in many embedded systems the initial RAM disk is the final root file system.

There are two ways to make a initial RAM disk for the Linux kernel: ```initrd``` and ```initramfs```. With ```initrd``` an image of a file system is supplied and is made available via a special block device. With ```initramfs``` a cpio archive (like tar but simpler) is supplied and the kernel unpacks the archive into a tempfs file system. Both ```initrd``` and ```initramfs``` can be compressed with gzip (or similar) providing the option to decompress the chosen type is enabled in the Linux Kernel. Both RAM disk types can also be optionally built directly into the kernel, resulting in a single binary.

## Initramfs
### Making a CPIO archive

Change directories to the root of the file system that you want to turn into an initramfs.
```bash
# Create a CPIO archive without compression
sh -c "find . | cpio -o --format=newc -R root:root" > ../ramdisk.cpio

# Create a CPIO archive compressed with gzip. 
sh -c "find . | cpio -o --format=newc -R root:root" | gzip -9 > ../ramdisk.cpio.gz
```

`-r root:root` sets the ownership of all files in the archive to root. This should be omitted if all the ownership of files has been set up correctly already (i.e. when using debootstrap for example).

### Extracting a CPIO archive
```bash
# If it is compressed with gzip, decompress it first
gunzip ramdisk.cpio.gz

# Make a directory to extract the root of the file system into
mkdir ramdisk
cd ramdisk
cpio -i -F ../ramdisk.cpio
```

## Initrd
### Make an Initrd
```bash
# Create an empty 4 MB ramdisk image
dd if=/dev/zero of=initrd.img bs=1024 count=4000
# Setup EXT2 file system
sudo losetup --show -f initrd.img
# Make a note of which /dev/loopX device is used 
# and use that in the next commands
sudo mke2fs /dev/loopX
# Mount the drive
mkdir temp
sudo mount /dev/loopX temp
cd temp
# Add any files to the file system
# ...
# When finished unmount the image
cd ..
sudo umount temp 
sudo losetup -d /dev/loopX

# If required, recompress the image
gzip -9 ./initrd.img
```

### Mount an Initrd

```bash
# If initrd is compressed then decompress it
gunzip ./initrd.img.gz

# Make a temp directory to mount the image
mkdir temp
sudo mount -o loop ./initrd.img temp
cd temp
# Inspect the file system and make changes if required
# ...
# When finished unmount the image
cd ..
sudo umount temp 

# If required, recompress the image
gzip -9 ./initrd.img
```

## U-Boot Headers
U-Boot headers may need to be added / removed to ramdisk and kernel files.

U-Boot headers are required when using the U-Boot command `bootm`, but not when using `bootz` or when using a Flattened uImage Tree (FIT) image. Older versions of U-Boot may not have the `bootz` option.

### Adding U-Boot headers
```bash
# E.g. gzip compressed CPIO archive for arm named initramfs.cpio.gz
mkimage -n 'Ramdisk Image' -A arm -O linux -T ramdisk -C gzip -d initramfs.cpio.gz uinitramfs.cpio.gz

# Eg. Uncompressed CPIO archive for arm64 named initramfs.cpio.gz
mkimage -n 'Ramdisk Image' -A arm64 -O linux -T ramdisk -C none -d initramfs.cpio uinitramfs.cpio

# E.g. Uncompressed kernel named Image
# -a -[load address] -e [entry point] 
mkimage -n 'Kernel Image' -A arm -O linux -C none -T kernel -a 0x8000 -e 0x8000 -d Image uImage

# E.g. Compressed kernel named zImage
mkimage -n 'Kernel Image' -A arm -O linux -C gzip -T kernel -a 0x8000 -e 0x8000 -d zImage uImage
# Note a zImage is self extracting. U-boot can typically extract gzip files, so it is often
# better to gzip an uncompressed kernel, and let U-Boot decompress it rather than using zImage.
```

### Removing U-Boot headers
Header is always 64 bytes long.
```bash
dd if=uinitramfs.cpio.gz of=initramfs.cpio.gz skip=1 bs=64
```