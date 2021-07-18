const EventEmitter = require("events");
const { spawn, exec } = require("child_process");
const path7za = require("7zip-bin").path7za;

export enum ArchiveType {
  SevenZIP = " -t7z",
  ZIP = " -tzip",
  GZIP = " -tgzip",
  BZIP2 = " -tbzip2",
  XZ = " -txz",
  WIM = " -twim",
  TAR = " -ttar",
}

export enum Level {
  STORE = " -mx0",
  FASTEST = " -mx1",
  FAST = " -mx3",
  NORMAL = " -mx5",
  MAXIMUM = " -mx7",
  ULTRA = " -mx9",
}

export enum Hasher {
  CRC32 = " -scrcCRC32",
  CRC64 = " -scrcCRC64",
  SHA1 = " -scrcSHA1",
  SHA256 = " -scrcSHA256",
  ALL = " -scrc*",
}

export enum Method {
  LZMA = " -mm=LZMA",
  LZMA2 = " -mm=LZMA2",
  PPMd = " -mm=PPMd",
  BZip2 = " -mm=BZip2",
  Deflate = " -mm=Deflate",
  Deflate64 = " -mm=Deflate64",
  NONE = "",
}

export enum ZIP_Method {
  LZMA = " -mm=LZMA",
  PPMd = " -mm=PPMd",
  BZip2 = " -mm=BZip2",
  Deflate = " -mm=Deflate",
  Deflate64 = " -mm=Deflate64",
}

export enum ZIP_Level {
  STORE = " -mx0",
  FASTEST = " -mx1",
  FAST = " -mx3",
  NORMAL = " -mx5",
  MAXIMUM = " -mx7",
  ULTRA = " -mx9",
}

export enum SevenZ_Method {
  LZMA = " -mm=LZMA",
  LZMA2 = " -mm=LZMA2",
  PPMd = " -mm=PPMd",
  BZip2 = " -mm=BZip2",
}

export enum SevenZ_Level {
  STORE = " -mx0",
  FASTEST = " -mx1",
  FAST = " -mx3",
  NORMAL = " -mx5",
  MAXIMUM = " -mx7",
  ULTRA = " -mx9",
}

export enum GZ_Method {
  Deflate = " -mm=Deflate",
}

export enum GZ_Level {
  FASTEST = " -mx1",
  FAST = " -mx3",
  NORMAL = " -mx5",
  MAXIMUM = " -mx7",
  ULTRA = " -mx9",
}

export enum BZIP2_Method {
  BZip2 = " -mm=BZip2",
}

export enum BZIP2_Level {
  FASTEST = " -mx1",
  FAST = " -mx3",
  NORMAL = " -mx5",
  MAXIMUM = " -mx7",
  ULTRA = " -mx9",
}

export enum TAR_Method {
  NONE = "",
}

export enum TAR_Level {
  STORE = " -mx0",
}

export enum WIM_Method {
  NONE = "",
}

export enum WIM_Level {
  STORE = " -mx0",
}

export enum XZ_Method {
  LZMA2 = " -mm=LZMA2",
}

export enum XZ_Level {
  FASTEST = " -mx1",
  FAST = " -mx3",
  NORMAL = " -mx5",
  MAXIMUM = " -mx7",
  ULTRA = " -mx9",
}

export enum EVENT {
  PROGRESS = "onProgress",
  ARCHIVE_INFO = "onArchiveInfo",
  ARCHIVE_STATS = "onArchiveStats",
  FINISH = "onFinish",
}

interface ExtractOptions {
  password: string;
}

interface CompressOptions {
  archive_type: ArchiveType;
  compression_method?:
    | Method
    | ZIP_Method
    | SevenZ_Method
    | GZ_Method
    | XZ_Method
    | BZIP2_Method
    | TAR_Method
    | WIM_Method;
  compression_level?:
    | Level
    | ZIP_Level
    | SevenZ_Level
    | GZ_Level
    | XZ_Level
    | BZIP2_Level
    | TAR_Level
    | WIM_Level;
  encrypt?: boolean;
  encrypt_name?: boolean;
  password?: string;
}

interface SevenZ_CompressOptions {
  compression_method?: SevenZ_Method;
  compression_level?: SevenZ_Level;
  encrypt?: boolean;
  encrypt_name?: boolean;
  password?: string;
}

interface ZIP_CompressOptions {
  compression_method?: ZIP_Method;
  compression_level?: ZIP_Level;
  encrypt?: boolean;
  //encrypt_name?: false;
  password?: string;
}

interface GZ_CompressOptions {
  //compression_method?: GZ_Method;
  compression_level?: GZ_Level;
  //encrypt?: boolean;
  //encrypt_name?: false;
  //password?: string;
}

interface TAR_CompressOptions {
  compression_method?: TAR_Method;
  compression_level?: TAR_Level;
  //encrypt?: boolean;
  //encrypt_name?: false;
  //password?: string;
}

interface WIM_CompressOptions {
  compression_method?: WIM_Method;
  compression_level?: WIM_Level;
  //encrypt?: boolean;
  //encrypt_name?: false;
  //password?: string;
}

interface XZ_CompressOptions {
  compression_level?: XZ_Level;
  //encrypt?: boolean;
  //encrypt_name?: false;
  //password?: string;
}

interface BZIP2_CompressOptions {
  compression_level?: BZIP2_Level;
  //encrypt?: boolean;
  //encrypt_name?: false;
  //password?: string;
}

interface Operation {
  err: any;
  payload: any;
}

export class SevenZip extends EventEmitter {
  constructor() {
    super();
    this.binary = path7za;
  }

  // Parsers for stdout
  private get_percentage(str: string) {
    if (str.indexOf("%") != -1) {
      let ret = Number.parseInt(str.substr(0, str.indexOf("%")).trim());
      return !ret ? 0 : ret;
    } else {
      return null;
    }
  }

  private get_info_val(str: string) {
    str = str.substring(str.indexOf("=") + 1, str.length).trim();
    return str;
  }

  private get_info(str: string) {
    // let str = `Path = .\test.7z
    //   Type = 7z
    //   Physical Size = 72364145
    //   Headers Size = 321
    //   Method = LZMA2:26 7zAES
    //   Solid = +
    //   Blocks = 1

    //     0%`;

    if (str.indexOf("Physical Size") == -1) {
      return null;
    }

    let info = {
      path: "",
      type: "",
      physical_size: 0,
      header_size: 0,
      method: "",
      solid: false,
      blocks: 0,
    };

    const lines = str.split("\n");
    lines.forEach((item) => {
      let line = item.trim();

      if (line.indexOf("Path") != -1) {
        info.path = this.get_info_val(line);
      }

      if (line.indexOf("Type") != -1) {
        info.type = this.get_info_val(line);
      }

      if (line.indexOf("Physical Size") != -1) {
        info.physical_size = Number.parseInt(this.get_info_val(line));
      }

      if (line.indexOf("Headers Size") != -1) {
        info.header_size = Number.parseInt(this.get_info_val(line));
      }

      if (line.indexOf("Method") != -1) {
        info.method = this.get_info_val(line);
      }

      if (line.indexOf("Solid") != -1) {
        info.solid = this.get_info_val(line) == "+" ? true : false;
      }

      if (line.indexOf("Blocks") != -1) {
        info.blocks = Number.parseInt(this.get_info_val(line));
      }
    });
    return info;
  }

  private get_stats(str: string) {
    if (
      str.indexOf("Files") == -1 ||
      str.indexOf("Folders") == -1 ||
      str.indexOf("Size") == -1 ||
      str.indexOf("Compressed") == -1
    ) {
      return null;
    }

    let info = {
      folders: 0,
      files: 0,
      size: 0,
      compressed: 0,
    };

    str.split("\n").forEach((item) => {
      let x = item.trim();

      if (x.indexOf("Folders") != -1) {
        info.folders = Number.parseInt(
          x.substring(x.indexOf(":") + 1, x.length)
        );
      }

      if (x.indexOf("Files") != -1) {
        info.files = Number.parseInt(x.substring(x.indexOf(":") + 1, x.length));
      }

      if (x.indexOf("Size") != -1) {
        info.size = Number.parseInt(x.substring(x.indexOf(":") + 1, x.length));
      }

      if (x.indexOf("Compressed") != -1) {
        info.compressed = Number.parseInt(
          x.substring(x.indexOf(":") + 1, x.length)
        );
      }
    });

    return info;
  }

  private get_hash(str: string, all: boolean) {
    if (
      !(
        str.indexOf("CRC32  for data:") != -1 ||
        str.indexOf("CRC64  for data:") != -1 ||
        str.indexOf("SHA256 for data:") != -1 ||
        str.indexOf("SHA1   for data:") != -1 ||
        str.indexOf("BLAKE2sp for data:") != -1
      )
    ) {
      return null;
    }

    let info = !all
      ? { value: "" }
      : {
          CRC32: "",
          CRC64: "",
          SHA256: "",
          SHA1: "",
          BLAKE2sp: "",
        };

    str.split("\n").forEach((item) => {
      let line = item.trim();

      if (line.indexOf("CRC32  for data:") != -1) {
        const tmp = line.substring(line.indexOf(":") + 1, line.length).trim();
        if (all) {
          info.CRC32 = tmp;
        } else {
          info.value = tmp;
        }
      }

      if (line.indexOf("CRC64  for data:") != -1) {
        const tmp = line.substring(line.indexOf(":") + 1, line.length).trim();
        if (all) {
          info.CRC64 = tmp;
        } else {
          info.value = tmp;
        }
      }

      if (line.indexOf("CRC64  for data:") != -1) {
        const tmp = line.substring(line.indexOf(":") + 1, line.length).trim();
        if (all) {
          info.CRC64 = tmp;
        } else {
          info.value = tmp;
        }
      }

      if (line.indexOf("SHA256 for data:") != -1) {
        const tmp = line.substring(line.indexOf(":") + 1, line.length).trim();
        if (all) {
          info.SHA256 = tmp;
        } else {
          info.value = tmp;
        }
      }

      if (line.indexOf("SHA1   for data:") != -1) {
        const tmp = line.substring(line.indexOf(":") + 1, line.length).trim();
        if (all) {
          info.SHA1 = tmp;
        } else {
          info.value = tmp;
        }
      }

      if (line.indexOf("BLAKE2sp for data:") != -1) {
        const tmp = line.substring(line.indexOf(":") + 1, line.length).trim();
        if (all) {
          info.BLAKE2sp = tmp;
        } else {
          info.value = tmp;
        }
      }
    });
    return info;
  }

  private get_extension(str: string) {
    return str.substring(str.lastIndexOf(".") + 1, str.length);
  }

  // 7z a 'hello.7z' './Extract Here/*' -ph -mhe

  // Operation functions
  private compress(
    filePath: string,
    includeDir: string,
    options: CompressOptions = {
      archive_type: ArchiveType.ZIP,
      compression_method: Method.NONE,
      compression_level: Level.NORMAL,
      encrypt: false,
      encrypt_name: false,
      password: "",
    }
  ) {
    let args = [
      "a",
      options.archive_type,
      `"${filePath}"`,
      `"${includeDir}"`,
      "-y",
      "-bsp1",
      options.compression_level,
      options.compression_method,
    ];

    let buffer = "";

    // Preparation of Command
    const extension = this.get_extension(filePath);

    if (extension !== "gz" && options.encrypt && options.password) {
      args.push(`-p${options.password}`);
    }

    if (extension !== "gz" && options.encrypt && options.encrypt_name) {
      args.push(`-mhe`);
    }

    const proc = spawn(this.binary, args, {
      shell: true,
    });

    let archive_info: any = undefined;
    let archive_stats: any = undefined;

    proc.stdout.on("data", (data: Buffer) => {
      const str = data.toString();
      buffer += str;

      let percentage = this.get_percentage(str);
      if (percentage != undefined) {
        this.emit("onProgress", percentage);
      }

      let pre_archive_info = this.get_info(str);
      if (pre_archive_info) {
        archive_info = pre_archive_info;
        this.emit("onArchiveInfo", pre_archive_info);
      }

      let post_archive_info = this.get_stats(str);
      if (post_archive_info) {
        archive_stats = post_archive_info;
        this.emit("onArchiveStats", post_archive_info);
      }
    });

    proc.stderr.on("data", (data: Buffer) => {
      const buffstr = data.toString();
      buffer += buffstr;

      this.emit("onFinish", {
        err: buffstr,
        buffer,
        payload: {
          info: { ...archive_info },
          stats: { ...archive_stats },
        },
      });
    });

    proc.on("exit", (code: number) => {
      buffer += `\nExit Code :: ${code.toString()}`;

      this.emit("onProgress", 100);
      this.emit("onFinish", {
        err: code,
        buffer,
        payload: {
          info: { ...archive_info },
          stats: { ...archive_stats },
        },
      });
    });
  }

  create = {
    zip: (
      filePath: string,
      includeDir: string,
      options: ZIP_CompressOptions = {
        compression_method: ZIP_Method.LZMA,
        compression_level: ZIP_Level.NORMAL,
        encrypt: false,
        password: "",
      }
    ) => {
      this.compress(filePath, includeDir, {
        archive_type: ArchiveType.ZIP,
        ...options,
        encrypt_name: false,
      });
    },

    sevenzip: (
      filePath: string,
      includeDir: string,
      options: SevenZ_CompressOptions = {
        compression_method: SevenZ_Method.LZMA2,
        compression_level: SevenZ_Level.NORMAL,
        encrypt: false,
        encrypt_name: false,
        password: "",
      }
    ) => {
      this.compress(filePath, includeDir, {
        archive_type: ArchiveType.SevenZIP,
        ...options,
      });
    },

    gzip: (
      filePath: string,
      includeDir: string,
      options: GZ_CompressOptions = {
        compression_level: GZ_Level.NORMAL,
      }
    ) => {
      this.compress(filePath, includeDir, {
        archive_type: ArchiveType.GZIP,
        compression_method: GZ_Method.Deflate,
        ...options,
        encrypt: false,
        encrypt_name: false,
        password: "",
      });
    },

    bzip2: (
      filePath: string,
      includeDir: string,
      options: BZIP2_CompressOptions = {
        compression_level: BZIP2_Level.NORMAL,
      }
    ) => {
      this.compress(filePath, includeDir, {
        archive_type: ArchiveType.BZIP2,
        compression_method: BZIP2_Method.BZip2,
        ...options,
        encrypt: false,
        encrypt_name: false,
        password: "",
      });
    },

    tar: (filePath: string, includeDir: string) => {
      this.compress(filePath, includeDir, {
        archive_type: ArchiveType.TAR,
        compression_level: TAR_Level.STORE,
        compression_method: TAR_Method.NONE,
        encrypt: false,
        encrypt_name: false,
        password: "",
      });
    },

    wim: (filePath: string, includeDir: string) => {
      this.compress(filePath, includeDir, {
        archive_type: ArchiveType.WIM,
        compression_level: WIM_Level.STORE,
        compression_method: WIM_Method.NONE,
        encrypt: false,
        encrypt_name: false,
        password: "",
      });
    },

    xz: (
      filePath: string,
      includeDir: string,
      options: XZ_CompressOptions = {
        compression_level: XZ_Level.NORMAL,
      }
    ) => {
      this.compress(filePath, includeDir, {
        archive_type: ArchiveType.XZ,
        compression_method: XZ_Method.LZMA2,
        ...options,
        encrypt: false,
        encrypt_name: false,
        password: "",
      });
    },
  };

  extract(
    filePath: string,
    outputDir: string,
    options: ExtractOptions = { password: "" }
  ) {
    // Preparation of Command
    let command = `"${filePath}" -o"${outputDir}" -y -bsp1`;
    let buffer = "";

    if (options.password) {
      command += ` -p${options.password}`;
    }

    const proc = spawn(this.binary, ["x", command], { shell: true });

    let archive_info: any = undefined;
    let archive_stats: any = undefined;

    proc.stdout.on("data", (data: Buffer) => {
      const str = data.toString();
      buffer += str;

      let percentage = this.get_percentage(str);
      if (percentage != undefined) {
        this.emit("onProgress", percentage);
      }

      let pre_archive_info = this.get_info(str);
      if (pre_archive_info) {
        archive_info = pre_archive_info;
        this.emit("onArchiveInfo", pre_archive_info);
      }

      let post_archive_info = this.get_stats(str);
      if (post_archive_info) {
        archive_stats = post_archive_info;
        this.emit("onArchiveStats", post_archive_info);
      }
    });

    proc.stderr.on("data", (data: Buffer) => {
      const buffstr = data.toString();
      buffer += buffstr;

      this.emit("onFinish", {
        err: buffstr,
        buffer,
        payload: {
          info: { ...archive_info },
          stats: { ...archive_stats },
        },
      });
    });

    proc.on("exit", (code: number) => {
      buffer += `\nExit Code :: ${code.toString()}`;

      this.emit("onProgress", 100);
      this.emit("onFinish", {
        err: code,
        buffer,
        payload: {
          info: { ...archive_info },
          stats: { ...archive_stats },
        },
      });
    });
  }

  hash(filePath: string, hasher: Hasher = Hasher.SHA1) {
    // Preparation of Command
    let command = `"${filePath}" ${hasher}`;
    let buffer = "";

    const proc = spawn(this.binary, ["h", command], { shell: true });

    proc.stdout.on("data", (data: Buffer) => {
      const str = data.toString();
      buffer += str;

      let percentage = this.get_percentage(str);
      if (percentage != undefined) {
        this.emit("onProgress", percentage);
      }

      let hash = this.get_hash(str, hasher === Hasher.ALL);
      if (hash) {
        this.emit("onProgress", 100);
        this.emit("onFinish", { err: 0, buffer, payload: { hash } });
      }
    });

    proc.stderr.on("data", (data: Buffer) => {
      const buffstr = data.toString();
      buffer += buffstr;

      this.emit("onFinish", { err: buffstr, buffer, payload: {} });
    });

    proc.on("exit", (code: number) => {
      buffer += `\nExit Code :: ${code.toString()}`;

      this.emit("onProgress", 100);
      this.emit("onFinish", { err: code, buffer, payload: {} });
    });
  }

  async hash_async(filePath: string, hasher: Hasher = Hasher.CRC32) {
    return new Promise((resolve, reject) => {
      // Preparation of Command
      let command = `${this.binary} h "${filePath}" ${hasher}`;

      exec(command, (err: Error, data: any) => {
        if (err) reject(err);
        const ret = this.get_hash(data, hasher === Hasher.ALL);
        resolve(ret);
      });
    });
  }
}
