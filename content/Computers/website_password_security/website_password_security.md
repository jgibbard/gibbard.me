title: Website password security
date: 2012/06/17
description: There has been a lot in the news recently about websites being ‘hacked’ and login details being stolen. Once a site is breached the method in which the login data was stored becomes very important, and determines how easy it is for the hackers to gain access to people’s passwords.
main_image: key.svg

# Website password security
This post was written on 17 June 2012. Can you believe that over 5 years later password security has got worse, not better! The information below is still valid, just a little out of date! If you are interested in up to date information in this area check out [Troy Hunt’s blog](https://www.troyhunt.com/){target="_blank"}.

<hr/>

There has been a lot in the news recently about websites being ‘hacked’ and login details being stolen. The most recent high profile case was [linkedin where over 6 million passwords were obtained](https://www.bbc.co.uk/news/technology-18338956){target="_blank"}. With these large scale security breaches becoming increasingly common it may be worth spending a few minutes to learn about how websites store passwords and what you can do to protect yourself from having your passwords stolen.

Most websites store login details in a large database located on a database server. Database servers are normally well protected, however as seen recently they cannot be assumed to be completely secure. Once a database is breached the method in which the login data was stored becomes very important, and determines how easy it is for the hackers to gain access to people’s passwords.Probably the best way to explain how websites store passwords is through a series of examples.

## Case 1:  Storing the password in plain text
In this first case the password is simply stored in the database in plain text.

I.e if your password is: `testpassword` then it will be stored in the database as: `testpassword`.

If a hacker was to gain access to the database they would immediately have access to everyone’s user names and passwords. This would not be a major problem, however unfortunately many people use the same user name and password combination for many different websites. A hacker could gain access to a low-profile website which has minimal security, and then use the user names and passwords to try and login to people’s email accounts.This is an extremely insecure method of storing passwords and very very few websites will use this technique.

## Case 2:  Storing the password as a hash
### What is a hash?
A hash takes any string of characters, of any length, and converts it to a fixed length string. When hashing passwords a special type of hash is used; this is known as a [Cryptographic hash](https://en.wikipedia.org/wiki/Cryptographic_hash_function){target="_blank"}. To put it simply with an ideal cryptographic hash it is easy to create a hash from a password, but practically impossible to obtain the password from the hash. Also a very small change in the password will result in a completely different hash.

The are many different hashing algorithms available including MD5, SHA-1 and SHA-2. Some vulnerabilities have been found with MD5 and SHA-1, however at time of writing SHA-2 is still a good option.

### How does it work?
1. When you create a new account a hash is generated for your password
2. Your user name and password hash are stored in the database
3. When you try and login a hash of you password is generated
4. The hash stored in the database is compared to the hash of the password you just entered
5. If they match you are logged in.

### Why is it not secure?
If a hacker gains access to the database they now have a big list of user names with the associated hashed passwords. As mentioned previously, it is very difficult to get from a hash back to the plain text password. Unfortunately hackers can easily generate the hashes for nearly every possible password combination and store them in massive lookup tables.
```sh
aaaaa: DF51E37C269AA94D38F93E537BF6E2020B21406C
aaaab: 0B6AF663352EE0C8C74C90D4B20B6C7724B0547B…

zzzzz: A2B7CADDBC353BD7D7ACE2067B8C4E34DB2097A3
```
To cover every possible combination these look up tables have to be very large. The number of possible combinations = `NUMBER OF CHARACTERS ^ PASSWORD LENGTH`. So if you are just using lower case letters and the password is 10 or less characters then there are 26¹⁰ = 1.4*10¹⁴ combinations. If you use capital letters as well that number rises to 52¹⁰ = 1.4*10¹⁷ and using all standard ASCII characters the are 128¹⁰ = 1.18*10²¹ possible combinations.These numbers may seem high but with the power of modern computers these tables can be generated relatively quickly and in many cases are available to download pre-computed from the internet.The hackers then compare the hashes stored in the lookup table with the hashes in the compromised database. If any match the plain text password can be read from the lookup table. Unfortunately this is the method linkedin were using to store passwords. As a result most of the hashes have already cracked and the plain text passwords revealed.

## Case 3:  Using a salt
### What is a salt?
A salt is some random data added to a password before it is hashed. The main purpose of a salt is to stop hackers using pre-computed lookup tables to crack large databases full of passwords. Salts can be any length, but longer salts help to increase the security.

### How does it work?
1. When you create a new account a random salt is generated.
2. The salt is combined with the password and the result is hashed.
3. The user name, salt and hashed combination of the password and salt are stored in the database.
4. When you try and login your password is combined with the salt and the result is hashed.
5. If this hash matches the hash stored in the database you are logged in.

### How does this help protect the password?
If a hacker gains access to the database they will have a list of all the user names, salts and the hash of the combination of the password and salt. The salts are long enough that a hacker can not feasibly generate a lookup table the covers every possible combination of password and salt. If all the passwords use the same salt the hacker can just regenerate the lookup tables so that they include the salt. However if the salts are long and random then using a lookup table is no longer a viable option for the hacker.

The passwords are still vulnerable to a brute-force attach, however this is much more time consuming.

## Case 4:  Key stretching
Key stretching is a technique used to slow down a brute force attack. Key stretching basically involves repeatedly hashing the output of the hash of the password and salt. When an attacker is attempting to gain the password through a brute force attack, each password they try will need to be hashed the same number of times as the hashes in the compromised database. If several 1000 iterations were used then it will take roughly 1000 times more CPU time to guess the password through a brute force attack. As computers get faster the number of iterations can be increased.

## What can you do to protect yourself?
1. Use a different password for every website you use
2. Use a long (14digits+) secure password containing uppercase, lowercase, numbers and symbols
3. Use a password manager like <a href="http://lastpass.com/" target="_blank">lastpass </a>or<a href="http://keepass.info/" target="_blank"> keypass</a> to keep track of all your passwords.