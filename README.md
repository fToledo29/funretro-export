# EasyRetro (former FunRetro) export

[![License][license-badge]][license-url]

> CLI tool to easily export [EasyRetro.io](https://funretro.io/) retrospective boards using Playwright

## Installing / Getting started

It's required to have [npm](https://www.npmjs.com/get-npm) installed locally to follow the instructions.

```shell
git clone https://github.com/fToledo29/funretro-export.git
cd funretro-export
npm install
npm start -- "https://easyretro.io/publicboar..." "csv" ##  Exports data as CSV File
npm start -- "https://easyretro.io/publicboar..." ##  Exports data as TXT File
```

## TODO

- Export options (TXT, CSV)

## Licensing

MIT License

[license-badge]: https://img.shields.io/github/license/robertoachar/docker-express-mongodb.svg
[license-url]: https://opensource.org/licenses/MIT
