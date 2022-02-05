title: Controlling I2C Devices from U-Boot
date: 2022/02/05
description: The I2C command in U-Boot allows reading and writing to I2C devices connected to an embedded system. This can be very useful for testing devices or quickly reading/writing values stored in I2C EEPROMs.
main_image: uboot_i2c.svg

## Finding I2C devices
If your processor has multiple I2C busses, you can set which one is used with the following command:
```bash

# Where <bus> is the number of the bus to select:
i2c dev <bus>
# Example - Select bus 0
i2c dev 0
```

To search for available devices use the following commands:
```bash
# Attempt to detect the addresses of all devices on the bus
i2c probe
# Check if a device is present, where <chip> is the address of the I2C device
i2c probe <chip>
# Example - Check if a device with address 0x50 is present
i2c probe 0x50
```

I2C addresses are typically 7 bits with the 8th bit indicating if the I2C operation is a read (0) or a write (1). U-Boot expects the address as just 7 bits, right alined within a byte. I.e. `0b0AAAAAAA`, where A is an address bit. 
Different IC datasheets specify the I2C address in different ways. Some may specify the address left aligned with the read bit appended. I.e. `0bAAAAAAA0`. In these cases, the datasheet address should be right shifted by one bit before using it for the U-Boot I2C commands. U-Boot automatically sets the read/write bit in the address field.

## Reading from an I2C device
You can dump memory to the screen using the following commands:
```bash
# <chip> is the address of the I2C IC.
# <register_address> is the register within the I2C device that you wish to read
# <address_length> is either 0, 1, or 2. 0 = no address, 1 = 8 bit address, 2 = 16 bit address.
# <length> is the number of bytes to read from the I2C device.
i2c md <chip> <register_address>[.<address_length>] <length>
# Example 1 - Read 0x100 bytes starting at register 0x00, from device with address 0x51. Address is 1 byte. 
i2c md 0x51 0x00.1 0x100
# Example 2 - Read 0x1000 byte starting at register 0x0400, from device with address 0x34. Address is 2 bytes. 
i2c md 0x34 0x0400.2 0x1000
# Example 3 - Read a single byte from device with address 0x60. Don't send register address word.
i2c md 0x60 0x00.0 0x1
```

You can also read from the I2C device directly into memory using the following command:

```bash
# <register_address>, <address_length>, and <length> are as per the i2c md command.
# <memory_address> is the address in the processors memory to copy the I2C data to.
i2c read <chip> <register_address>[.<address_length>] <length> <memory_address>
# Example: copy into memory location 0x40000000, 0x80 bytes starting at register
# address 0x10 of the I2C device with address 0x50.
i2c read 0x50 0x10 0x80 0x40000000
```

Most devices have an auto incrementing read pointer, so after a register is read, the next read will be from the next register address. 

## Writing to an I2C device
You write to I2C device's registers directly using the following command:

```bash
# <chip> is the address of the I2C IC.
# <register_address> is the register within the I2C device that you wish to read
# <address_length> is either 0, 1, or 2. 0 = no address, 1 = 8 bit address, 2 = 16 bit address.
# <value> is the value to write to the register address.
# <length> is the number of bytes to write to the I2C device.
i2c mw <chip> <register_address>[.<address_length>] <value> <length>
# Example 1 - Write 0x1 byte with value 0xAA to register 0xE5 of the I2C
# device with address 0x28. Address is 1 byte. 
i2c mw 0x28 0xE5.1 0xAA 0x1
```
