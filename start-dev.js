// Launcher script for preview_start — changes CWD to project root
process.chdir(__dirname);
process.argv = [process.argv[0], process.argv[1], "dev", "--port", "3000"];
require("next/dist/bin/next");
