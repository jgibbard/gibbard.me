title: Flattened uImage Tree (FIT) Images
date: 2021/10/23
description: Flattened uImage Tree (FIT) images are commonly used on embedded linux systems. This article covers the steps required to examine, extract, and regenerate a FIT image.
main_image: linux_fit_images.svg

## Introduction
### What are FIT images?
Flattened uImage Tree (FIT) is a format for combining multiple binary elements such as the kernel, initramfs, and device tree blob into a single image file. FIT images use a structure similar to the device tree blob, but with the chosen binaries embedded inside it. FIT images contain metadata like what each binary is, and what location it should be copied into memory. Bootloaders like U-Boot can read and process this metadata in order to boot an embedded linux system.

The `.itb` extension is commonly used to indicate that the file is a FIT image, however unfortunately some system providers use other extensions. e.g. Xilinx use `.ub`.

### Prerequisites
In order to work with FIT images you need `mkimage`, `dumpimage`, and `dtc`. These are typically available via the `u-boot-tools` and `device-tree-compiler` packages (debian), or possibly the `uboot-tools` and `dtc` packages on some other distributions.

Alternatively you can install them from source by following the commands below.
```bash
sudo apt-get install gcc make bison diffutils libssl-dev
git clone https://github.com/u-boot/u-boot.git
cd u-boot
git checkout v2021.10
make tools-only_defconfig
make tools-only
# Temporarily add tools to path 
export PATH=$PATH:$PWD/tools
cd ..
git clone git://git.kernel.org/pub/scm/utils/dtc/dtc.git
cd dtc
git checkout v1.6.1
make
export PATH=$PATH:$PWD
```

## Inspect a FIT image
An example FIT image can be obtained from Xilinx [here](https://xilinx-wiki.atlassian.net/wiki/spaces/A/pages/18842316/Linux+Prebuilt+Images){target="_blank"} (Xilinx account required). For this example I downloaded and extracted `2021.1-zed-release.tar.xz` to get a `image.ub` FIT image file. This image is for the Avnet Zedboard running a Xilinx Zynq 7020 SoC, but the procedure to inspect, extract, and regenerate a FIT image is the same across all platforms.

To inspect the FIT image use the `dumpimage` tool. This will display a list of all the binaries that make up the FIT image and their respective metadata.

```bash
dumpimage -l image.ub
```

A dump of the example Xilinx image is show below.

```
FIT description: U-Boot fitImage for PetaLinux/5.10+gitAUTOINC+c830a552a6/zynq-generic
Created:         Fri Jun  4 16:57:16 2021
 Image 0 (kernel-1)
  Description:  Linux kernel
  Created:      Fri Jun  4 16:57:16 2021
  Type:         Kernel Image
  Compression:  uncompressed
  Data Size:    4588688 Bytes = 4481.14 KiB = 4.38 MiB
  Architecture: ARM
  OS:           Linux
  Load Address: 0x00200000
  Entry Point:  0x00200000
  Hash algo:    sha256
  Hash value:   0801a5a3813dc638c0d70a61ee95dffc979828cb8e34d69f644a31beac2991c8
 Image 1 (fdt-system-top.dtb)
  Description:  Flattened Device Tree blob
  Created:      Fri Jun  4 16:57:16 2021
  Type:         Flat Device Tree
  Compression:  uncompressed
  Data Size:    20544 Bytes = 20.06 KiB = 0.02 MiB
  Architecture: ARM
  Hash algo:    sha256
  Hash value:   943a1d81705aee19a35400f2e9cf5041e4324f48a460065d40ec603b59b0438c
 Image 2 (ramdisk-1)
  Description:  petalinux-image-minimal
  Created:      Fri Jun  4 16:57:16 2021
  Type:         RAMDisk Image
  Compression:  uncompressed
  Data Size:    9519768 Bytes = 9296.65 KiB = 9.08 MiB
  Architecture: ARM
  OS:           Linux
  Load Address: unavailable
  Entry Point:  unavailable
  Hash algo:    sha256
  Hash value:   9ddff7376b93b7f6fadfa105b84f3bb669ed22581e4aae06c3cd6508267fd3f2
 Default Configuration: 'conf-system-top.dtb'
 Configuration 0 (conf-system-top.dtb)
  Description:  1 Linux kernel, FDT blob, ramdisk
  Kernel:       kernel-1
  Init Ramdisk: ramdisk-1
  FDT:          fdt-system-top.dtb
  Hash algo:    sha256
  Hash value:   unavailable
```

## Extract an image from a FIT image
`dumpimage` can be used to extract the individual images that make up the FIT image. The ```-p``` option allows the image number to be specified. This image number corresponds to the `Image X` number when `dumpimage -l` is used to inspect the image.

```bash
mkdir temp

# Extract the kernel
dumpimage -T flat_dt -p 0 -i image.ub temp/Image
# NB: Change to "dumpimage -T flat_dt -p 0 -o temp/Image image.ub" on newer versions of dumpimage

# Extract the device tree blob
dumpimage -T flat_dt -p 1 -i image.ub temp/system.dtb
# NB: Change to "dumpimage -T flat_dt -p 1 -o temp/system.dtb image.ub" on newer versions of dumpimage

# Extract the ramdisk
# Note, compression is "uncompressed" so extension is .cpio not .cpio.gz
dumpimage -T flat_dt -p 2 -i image.ub temp/ramdisk.cpio
# NB: Change to "dumpimage -T flat_dt -p 2 -o temp/ramdisk.cpio image.ub" on newer versions of dumpimage
```

You can now make any modifications to the individual elements of the FIT image, for example replace the kernel, update the device tree, or modify the initramfs.

## Create a FIT image

To create a FIT image an Image Tree Source [`.its`] file needs to be generated. There is currently no way to extract the `.its` file from an existing FIT image file, however it is relatively simple to make a new one based on the output from `dumpimage -l image.ub`.

Below is an example based on the Xilinx `image.ub` file used above. 
```
/dts-v1/;
  
/ {
    description = "U-Boot fitImage for PetaLinux/5.10+gitAUTOINC+c830a552a6/zynq-generic";
    #address-cells = <1>;
  
    images {
        kernel-1 {
            description = "Linux kernel";
            data = /incbin/("./Image");
            type = "kernel";
            arch = "ARM";
            os = "linux";
            compression = "none";
            load = <0x200000>;
            entry = <0x200000>;
            hash {
                algo = "sha256";
            };
        };
        fdt-system-top.dtb {
            description = "Flattened Device Tree blob";
            data = /incbin/("./system.dtb");
            type = "flat_dt";
            arch = "ARM";
            compression = "none";
            hash {
                algo = "sha256";
            };
        };
        ramdisk-1 {
            description = "petalinux-image-minimal";
            data = /incbin/("./ramdisk.cpio");
            type = "ramdisk";
            arch = "ARM";
            os = "linux";
            compression = "none";
            hash {
                algo = "sha256";
            };
        };
    };
    configurations {
        default = "conf-system-top.dtb";
        conf-system-top.dtb {
            description = "1 Linux kernel, FDT blob, ramdisk";
            kernel = "kernel-1";
            fdt = "fdt-system-top.dtb";
            ramdisk = "ramdisk-1";
            hash {
                algo = "sha256";
            };
        };
    };
};
```
Create a file named `image.its` with contents similar to the example above. A skeleton example `.its` file is included at the end of this article.

Image node names like `fdt-system-top.dtb` can be named anything; here they are set to match what was used in the original example `image.ub` file.

Common hash algorithm options are `sha256`, `sha1`, `md5`, and `crc32`. `mkimage` will hash the file and embed the hash in the FIT image automatically. Supported compression options are `gzip`, `bzip2`, and `none`. `mkimage` does not compress the files, you must specify the type of compression that has already been used on the binaries.

Full details of the image tree source file schema can be found [here](https://github.com/u-boot/u-boot/blob/master/doc/uImage.FIT/source_file_format.txt){target="_blank"}.

To build a FIT image use the following command:
```bash
mkimage -f image.its image.ub
```

If you are trying to modify an existing FIT image, it a good idea to run `dumpimage -l` on the new FIT image and compare it to the original image.


## Skeleton Image Tree Source File
This is a skeleton `.its` file. It is a useful starting point when making one from scratch.
```
/dts-v1/;
  
/ {
    description = "FIT Image Example";
    #address-cells = <1>;
  
    images {
        kernel {
            description = "Linux kernel";
            data = /incbin/("./Image");
            type = "kernel";
            arch = "ARM";
            os = "linux";
            compression = "none";
            load = <0x8000>;
            entry = <0x8000>;
            hash {
                algo = "sha256";
            };
        };
        dtb {
            description = "Flattened Device Tree Blob";
            data = /incbin/("./system.dtb");
            type = "flat_dt";
            arch = "ARM";
            compression = "none";
            hash {
                algo = "sha256";
            };
        };
        ramdisk {
            description = "Ramdisk";
            data = /incbin/("./ramdisk.cpio.gz");
            type = "ramdisk";
            arch = "ARM";
            os = "linux";
            compression = "gzip";
            hash {
                algo = "sha256";
            };
        };
    };
    configurations {
        default = "conf";
        conf {
            description = "Linux kernel + FDT blob + Ramdisk";
            kernel = "kernel";
            fdt = "dtb";
            ramdisk = "ramdisk";
            hash {
                algo = "sha256";
            };
        };
    };
};
```