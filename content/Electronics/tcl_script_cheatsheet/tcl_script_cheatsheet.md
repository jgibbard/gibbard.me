title: Tcl Script Cheatsheet
date: 2022/10/15
description: Tcl (Tool command language) is a high level interpreted language that is commonly used by FPGA development tools. This article covers the basics of using Tcl.
main_image: terminal.svg

## Basic Language Syntax

## Print to the screen
```tcl
puts "Hello, world!"
```

## Variables

Variables are strings
```tcl
# Set x to string hello
set x hello
# Set my_variable to string 22
set my_variable 22
# Expand a variable 
puts "The value of my_variable is $my_variable" 
```
```
> The value of my_variable is 22
```

White space is used to delimit items in a list
```tcl
set y "One two three"
# Print a list with one item per line
join $y \n
```
```
> One
> Two
> Three
```

If you want a variable to be a string including whitespace and not a list, use { }
```tcl
set z {One two three}
join $z \n
```
```
> One two three
```
Get the length of a list
```tcl
set a "One two three"
llength $a
```
```
> 3
```
Arrays are zero indexed
```tcl
set a "One two three"
lindex $a 1
```
```
> two
```

## Maths
The `expr` function performs mathematical operations on string variables that are numbers.
```tcl
set a 10
set b 20
expr $a * $b
expr ($a * $b) + 10
```
```
> 200
> 210
```
Integer maths is used unless one variable is a float
```tcl
set a 10
set b 3
set c 3.0
expr $a / $b
expr $a / $c
```

```
> 3
> 3.3333333333333335
```

## Command expansion 

Square brackets allow inline command expansion
```tcl
set x 10
set y 2
set z 3.0
puts "10 / 2  is [expr $x / $y]"
puts "(10 / 2) / 3.0  is [expr [expr $x / $y] / $z]"
```

```
> 10 / 2  is 5
> (10 / 2) / 3.0  is 1.6666666666666667
```

## Loops
Step through each item in a list
```tcl
set values "1 2 3"
foreach value $values {puts "Value: $value"}
```
```
> Value: 1
> Value: 2
> Value: 3
```
Curly braces can be split over multiple lines
```tcl
foreach value $values {
    puts "Value: $value"
}
```
While loops can also be used
```tcl
set x 0
while {x < 3} {
    puts "[incr x]"
}
```
```
> 1
> 2
> 3
```

## If statements
`If`, `elseif`, and `else` are all allowed
```tcl
set x 3
if {$x > 5} {
  puts "X is > 5"
} else {
  puts "X is <= 5"
}
```
```
> X is <= 5
```

```tcl
set y 2
if {$y == 1} {
  puts "Y is 1"
} elseif {$y == 2} {
  puts "Y is 2"
} else {
  puts "Y is not 1 or 2"
}
```

```
> Y is 2
```

## File handling
Open a file for writing using `open file_name.ext w`. This returns a file handle.

Write to a file using `puts` followed by the file handle and the string to write.
```tcl
set fh [open test.txt w]
puts $fh "Hello, World"
puts $fh "Hi!"
close $fh
```

Open a file for reading using `open file_name.ext r`.

Use `gets` to read a line from the file. If `gets` is called with a single argument (the file handle), it returns a line from the file as a string.
```tcl
set fh [open test.txt r]
puts [gets $fh]
close $fh
```
If `gets` is called with two arguments, it returns the line length, or -1 when at end of the file. The line's contents is stored in the second variable.
```tcl
set fh [open test.txt r]
puts "Line length: [gets $fh line]"
puts "Line contents $line"
close $fh
```
You can loop through a whole file like this:
```tcl
set fh [open test.txt r]
set line_number 0
while {[gets $fh line] >= 0} {
    puts "[incr line_number]: $line"
}
close $fh
```

## Procedures
You can make procedures like this
```tcl
proc print_file filename {
  set fh [open $filename r]
  puts [read $fh]
  close $fh
}
print_file test.txt
```

Or with multiple arguments
```tcl
proc say_hi {name1 name2} {
  puts "Hi $name1"
  puts "Hi $name2"
}
say_hi Bob Steve
```
```
> Hi Bob
> Hi Steve
```

## Time
Get a unix timestamp using `clock seconds`. You can format it as a nice date / time using `clock format`.

```tcl
clock seconds
clock format [clock seconds] -format "%Y-%m-%d %H:%M:%S"
```
```
1665861034
2022-10-15 20:10:34
```

Get the last modified time of a file:
```tcl
file mtime file_name.ext
clock format [clock seconds] -format "%Y-%m-%d %H:%M:%S"
```
```
1665861034
2022-10-15 20:10:34
```