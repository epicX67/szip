# Szip

An event based 7zip wrapper for nodejs.

### Installation

    npm i szip

### Events

Most of the functions in this package are event based. Here are some events which you have to use to get the data while in operation.

#### EVENT.PROGRESS

This event receives how much operation has been done in %.

    const { SevenZip, EVENT } =  require("szip");

    // Instance created
    const szip = new SevenZip();

    szip.on(EVENT.PROGRESS, (data) => {
    	console.log(`Done :: ${data}%`);
    });

---

#### EVENT.FINISH

This event receives when operation finished.

    const { SevenZip, EVENT } =  require("szip");

    // Instance created
    const szip = new SevenZip();

    szip.on(EVENT.FINISH, (data) => {
    	// 	data.err {string | number} contains error message
    	// 	data.buffer {string} containes stdout buffer of the operation
    	// 	data.payload {object} contains any information about result.
    });

### Extract File

To extract a file you have use **extract** function from sevenzip class.
Here is an example below,

    const { SevenZip, EVENT } =  require("szip");

    const szip = new SevenZip();

    szip.on(EVENT.PROGRESS, (data) => {
    	console.log(`Done :: ${data}%`);
    });

    szip.on(EVENT.FINISH, (data) => {
    	if (data.err) {
    		console.log(data.err);
    	} else {
    		console.log(`Successfull Operation. Exit Code :: ${data.err}`);
    	}
    });

    // For normal archives
    szip.extract("h.7z", "./extract/*");

    // Use option for encrypted archives
    szip.extract("h.7z", "./extract/*", {password:  "123@password"});

---

### Create Archive

To create an archive you have to use **create.{archivesType}()**
List of supported archive

- 7z - **create.sevenz()**
- zip - **create.zip()**
- gz - **create.gzip()**
- bzip2 - **create.bzip2()**
- tar - **create.tar()**
- wim - **create.wim()**
- xz - **create.xz()**

> **Note:** Each function have different option parameters because each archive types doesn't support every features like pasword, encrpyted file name or maybe compression method etc.

#### Example of creating an archive using password + encrypted filenames

    const { SevenZip, EVENT } =  require("szip");

    const szip = new SevenZip();

    szip.on(EVENT.PROGRESS, (data) => {
    	console.log(`Done :: ${data}%`);
    });

    szip.on(EVENT.FINISH, (data) => {
    	if (data.err) {
    		console.log(data.err);
    	} else {
    		console.log(`Successfull Operation. Exit Code :: ${data.err}`);
    	}
    });

    szip.create.sevenz("h.7z", "./*", {
    	compression_method: SevenZ_Method.LZMA2,
    	compression_level: SevenZ_Level.MAXIMUM,
    	encrypt: true,
    	encrypt_name: true,
    	password: "hello",
    });

#### Generate Hash of File

To genarate hash of file, you have to use **hash()** or **hash_async()**

#### Example hash()

    const { SevenZip, EVENT, Hasher } =  require("szip");

    const  szip  =  new  SevenZip();

    szip.on(EVENT.PROGRESS, (data) => {
    	console.log(`Done :: ${data}%`);
    });

    szip.on(EVENT.FINISH, (data) => {
    	if (data.err) {
    		console.log(data.err);
    	} else {
    		console.log(data.payload.hash);
    		console.log(`Successfull Operation. Exit Code :: ${data.err}`);
    	}
    });

    szip.hash("index.js", Hasher.SHA1);

#### Output

    Done :: 100%
    { value: '38EF913D283D71177BFCC43828314208A8DB2B66' }
    Successfull Operation. Exit Code :: 0

---

#### Example hash_async()

    const { SevenZip, EVENT, Hasher } =  require("szip");

    const  szip  =  new  SevenZip();

    szip.hash_async("index.js", Hasher.SHA1).then((data) => {
    	console.log(data);
    }).catch((err) => {
    	console.log(err);
    });

#### Output

    { value: '38EF913D283D71177BFCC43828314208A8DB2B66' }

**Note:** You can use different hashing alorithms too. Avaliable hashing algorithms are down below.

- CRC32
- CRC64
- SHA1
- SHA256
- ALL

Choose any one option from above into the parameter. Hasher.{HashingAlogrithm}
By default function will use **SHA1** as hashing algorithm if you dont pass hash parameter.

> More functions Like **Testing Archives, Async version of compress and extract** functions are coming soon. If you like this wrapper package please give this repo a star :)

Credits,
[7zip](https://www.7-zip.org/)
[7zip-bin (npm package)](https://github.com/develar/7zip-bin)
