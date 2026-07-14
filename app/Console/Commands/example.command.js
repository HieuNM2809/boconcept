#!/usr/bin/env node
const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '../../../.env')});

const yargs = require('yargs');
const {hideBin} = require('yargs/helpers');
const ExampleService = require('../../Services/Api/example.service');

// CLI mẫu dùng yargs. Chạy: node app/Console/Commands/example.command.js <cmd>
yargs(hideBin(process.argv))
    .scriptName('example')
    .usage('$0 <cmd> [args]')
    .command(
        'list',
        'Liệt kê examples',
        (y) => y.option('page', {alias: 'p', type: 'number', default: 1}),
        async (argv) => {
            try {
                const result = await ExampleService.getAll({page: argv.page});
                console.log(JSON.stringify(result, null, 2));
                process.exit(0);
            } catch (err) {
                console.error('[example:list] Lỗi:', err.message);
                process.exit(1);
            }
        }
    )
    .command(
        'seed',
        'Tạo 1 example mẫu',
        (y) => y.option('name', {alias: 'n', type: 'string', demandOption: true}),
        async (argv) => {
            try {
                const item = await ExampleService.create({name: argv.name});
                console.log(`[example:seed] Đã tạo example #${item.id} (${item.name})`);
                process.exit(0);
            } catch (err) {
                console.error('[example:seed] Lỗi:', err.message);
                process.exit(1);
            }
        }
    )
    .demandCommand(1, 'Bạn cần chỉ định một command.')
    .help()
    .alias('help', 'h')
    .argv;

// Ví dụ:
// node app/Console/Commands/example.command.js list -p 1
// node app/Console/Commands/example.command.js seed -n "Demo"
