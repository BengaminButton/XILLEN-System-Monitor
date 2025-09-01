const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

class XillenSystemMonitor {
    constructor() {
        this.monitoring = false;
        this.stats = {
            cpu: [],
            memory: [],
            disk: [],
            network: [],
            processes: []
        };
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    start() {
        console.clear();
        this.showBanner();
        this.showMenu();
    }

    showBanner() {
        console.log('\x1b[36m');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║                    XILLEN System Monitor                    ║');
        console.log('║                        v2.0 by @Bengamin_Button            ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('\x1b[0m');
    }

    showMenu() {
        console.log('\n\x1b[33mВыберите действие:\x1b[0m');
        console.log('1. Системная информация');
        console.log('2. Мониторинг CPU');
        console.log('3. Мониторинг памяти');
        console.log('4. Мониторинг диска');
        console.log('5. Мониторинг сети');
        console.log('6. Мониторинг процессов');
        console.log('7. Полный мониторинг');
        console.log('8. Экспорт отчета');
        console.log('9. Выход');
        
        this.rl.question('\nВведите номер: ', (answer) => {
            this.handleMenuChoice(answer);
        });
    }

    handleMenuChoice(choice) {
        switch(choice) {
            case '1':
                this.showSystemInfo();
                break;
            case '2':
                this.monitorCPU();
                break;
            case '3':
                this.monitorMemory();
                break;
            case '4':
                this.monitorDisk();
                break;
            case '5':
                this.monitorNetwork();
                break;
            case '6':
                this.monitorProcesses();
                break;
            case '7':
                this.fullMonitoring();
                break;
            case '8':
                this.exportReport();
                break;
            case '9':
                this.exit();
                break;
            default:
                console.log('\x1b[31mНеверный выбор!\x1b[0m');
                setTimeout(() => this.showMenu(), 1000);
        }
    }

    showSystemInfo() {
        console.clear();
        console.log('\x1b[36m=== Системная информация ===\x1b[0m\n');
        
        const platform = os.platform();
        const arch = os.arch();
        const hostname = os.hostname();
        const uptime = this.formatUptime(os.uptime());
        const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
        const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
        const cpus = os.cpus();
        
        console.log(`\x1b[32mОС:\x1b[0m ${platform} ${arch}`);
        console.log(`\x1b[32mХост:\x1b[0m ${hostname}`);
        console.log(`\x1b[32mВремя работы:\x1b[0m ${uptime}`);
        console.log(`\x1b[32mПамять:\x1b[0m ${freeMem} GB / ${totalMem} GB`);
        console.log(`\x1b[32mПроцессоры:\x1b[0m ${cpus.length} ядер`);
        console.log(`\x1b[32mМодель CPU:\x1b[0m ${cpus[0].model}`);
        
        this.showNetworkInterfaces();
        
        this.rl.question('\nНажмите Enter для возврата в меню...', () => {
            this.showMenu();
        });
    }

    showNetworkInterfaces() {
        console.log('\n\x1b[36m=== Сетевые интерфейсы ===\x1b[0m');
        const interfaces = os.networkInterfaces();
        
        Object.keys(interfaces).forEach(name => {
            interfaces[name].forEach(interface => {
                if (interface.family === 'IPv4' && !interface.internal) {
                    console.log(`\x1b[32m${name}:\x1b[0m ${interface.address}`);
                }
            });
        });
    }

    monitorCPU() {
        console.clear();
        console.log('\x1b[36m=== Мониторинг CPU ===\x1b[0m\n');
        console.log('Нажмите Ctrl+C для остановки...\n');
        
        this.monitoring = true;
        const interval = setInterval(() => {
            if (!this.monitoring) {
                clearInterval(interval);
                return;
            }
            
            const cpus = os.cpus();
            let totalIdle = 0;
            let totalTick = 0;
            
            cpus.forEach(cpu => {
                for (let type in cpu.times) {
                    totalTick += cpu.times[type];
                }
                totalIdle += cpu.times.idle;
            });
            
            const idle = totalIdle / cpus.length;
            const total = totalTick / cpus.length;
            const usage = 100 - (100 * idle / total);
            
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] CPU Usage: ${usage.toFixed(2)}%`);
            
            this.stats.cpu.push({
                timestamp: timestamp,
                usage: usage.toFixed(2)
            });
        }, 1000);
        
        this.rl.question('', () => {
            this.monitoring = false;
            clearInterval(interval);
            this.showMenu();
        });
    }

    monitorMemory() {
        console.clear();
        console.log('\x1b[36m=== Мониторинг памяти ===\x1b[0m\n');
        console.log('Нажмите Ctrl+C для остановки...\n');
        
        this.monitoring = true;
        const interval = setInterval(() => {
            if (!this.monitoring) {
                clearInterval(interval);
                return;
            }
            
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const usagePercent = (usedMem / totalMem) * 100;
            
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] Memory: ${(usedMem / (1024 * 1024 * 1024)).toFixed(2)} GB / ${(totalMem / (1024 * 1024 * 1024)).toFixed(2)} GB (${usagePercent.toFixed(2)}%)`);
            
            this.stats.memory.push({
                timestamp: timestamp,
                used: (usedMem / (1024 * 1024 * 1024)).toFixed(2),
                total: (totalMem / (1024 * 1024 * 1024)).toFixed(2),
                usage: usagePercent.toFixed(2)
            });
        }, 1000);
        
        this.rl.question('', () => {
            this.monitoring = false;
            clearInterval(interval);
            this.showMenu();
        });
    }

    monitorDisk() {
        console.clear();
        console.log('\x1b[36m=== Мониторинг диска ===\x1b[0m\n');
        
        if (os.platform() === 'win32') {
            this.getWindowsDiskInfo();
        } else {
            this.getUnixDiskInfo();
        }
        
        this.rl.question('\nНажмите Enter для возврата в меню...', () => {
            this.showMenu();
        });
    }

    getWindowsDiskInfo() {
        exec('wmic logicaldisk get size,freespace,caption', (error, stdout) => {
            if (error) {
                console.log('Ошибка получения информации о диске:', error.message);
                return;
            }
            
            const lines = stdout.trim().split('\n').slice(1);
            console.log('\x1b[32mДиск | Свободно | Всего | Использовано\x1b[0m');
            console.log('─'.repeat(50));
            
            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 3) {
                    const drive = parts[0];
                    const freeSpace = parseInt(parts[1]);
                    const totalSize = parseInt(parts[2]);
                    const usedSpace = totalSize - freeSpace;
                    const usagePercent = (usedSpace / totalSize) * 100;
                    
                    console.log(`${drive} | ${(freeSpace / (1024 * 1024 * 1024)).toFixed(2)} GB | ${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB | ${usagePercent.toFixed(2)}%`);
                    
                    this.stats.disk.push({
                        drive: drive,
                        free: (freeSpace / (1024 * 1024 * 1024)).toFixed(2),
                        total: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
                        usage: usagePercent.toFixed(2)
                    });
                }
            });
        });
    }

    getUnixDiskInfo() {
        exec('df -h', (error, stdout) => {
            if (error) {
                console.log('Ошибка получения информации о диске:', error.message);
                return;
            }
            
            const lines = stdout.trim().split('\n').slice(1);
            console.log('\x1b[32mФайловая система | Размер | Использовано | Доступно | Использовано%\x1b[0m');
            console.log('─'.repeat(80));
            
            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 5) {
                    const filesystem = parts[0];
                    const size = parts[1];
                    const used = parts[2];
                    const available = parts[3];
                    const usagePercent = parts[4];
                    
                    console.log(`${filesystem} | ${size} | ${used} | ${available} | ${usagePercent}`);
                    
                    this.stats.disk.push({
                        filesystem: filesystem,
                        size: size,
                        used: used,
                        available: available,
                        usage: usagePercent
                    });
                }
            });
        });
    }

    monitorNetwork() {
        console.clear();
        console.log('\x1b[36m=== Мониторинг сети ===\x1b[0m\n');
        
        const interfaces = os.networkInterfaces();
        console.log('\x1b[32mАктивные интерфейсы:\x1b[0m\n');
        
        Object.keys(interfaces).forEach(name => {
            interfaces[name].forEach(interface => {
                if (interface.family === 'IPv4' && !interface.internal) {
                    console.log(`\x1b[33m${name}:\x1b[0m`);
                    console.log(`  IP: ${interface.address}`);
                    console.log(`  Маска: ${interface.netmask}`);
                    console.log(`  MAC: ${interface.mac}`);
                    console.log('');
                    
                    this.stats.network.push({
                        name: name,
                        ip: interface.address,
                        netmask: interface.netmask,
                        mac: interface.mac
                    });
                }
            });
        });
        
        this.rl.question('\nНажмите Enter для возврата в меню...', () => {
            this.showMenu();
        });
    }

    monitorProcesses() {
        console.clear();
        console.log('\x1b[36m=== Мониторинг процессов ===\x1b[0m\n');
        
        if (os.platform() === 'win32') {
            this.getWindowsProcesses();
        } else {
            this.getUnixProcesses();
        }
        
        this.rl.question('\nНажмите Enter для возврата в меню...', () => {
            this.showMenu();
        });
    }

    getWindowsProcesses() {
        exec('tasklist /FO CSV /NH', (error, stdout) => {
            if (error) {
                console.log('Ошибка получения списка процессов:', error.message);
                return;
            }
            
            const lines = stdout.trim().split('\n');
            console.log('\x1b[32mПроцесс | PID | Память | Описание\x1b[0m');
            console.log('─'.repeat(60));
            
            lines.slice(0, 20).forEach(line => {
                const parts = line.split('","');
                if (parts.length >= 4) {
                    const process = parts[0].replace(/"/g, '');
                    const pid = parts[1].replace(/"/g, '');
                    const memory = parts[4].replace(/"/g, '');
                    const description = parts[3].replace(/"/g, '');
                    
                    console.log(`${process} | ${pid} | ${memory} | ${description}`);
                    
                    this.stats.processes.push({
                        name: process,
                        pid: pid,
                        memory: memory,
                        description: description
                    });
                }
            });
        });
    }

    getUnixProcesses() {
        exec('ps aux --sort=-%mem | head -20', (error, stdout) => {
            if (error) {
                console.log('Ошибка получения списка процессов:', error.message);
                return;
            }
            
            const lines = stdout.trim().split('\n').slice(1);
            console.log('\x1b[32mПользователь | PID | CPU% | MEM% | Команда\x1b[0m');
            console.log('─'.repeat(80));
            
            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 11) {
                    const user = parts[0];
                    const pid = parts[1];
                    const cpu = parts[2];
                    const mem = parts[3];
                    const command = parts.slice(10).join(' ');
                    
                    console.log(`${user} | ${pid} | ${cpu}% | ${mem}% | ${command.substring(0, 50)}...`);
                    
                    this.stats.processes.push({
                        user: user,
                        pid: pid,
                        cpu: cpu,
                        mem: mem,
                        command: command
                    });
                }
            });
        });
    }

    fullMonitoring() {
        console.clear();
        console.log('\x1b[36m=== Полный мониторинг системы ===\x1b[0m\n');
        console.log('Нажмите Ctrl+C для остановки...\n');
        
        this.monitoring = true;
        const interval = setInterval(() => {
            if (!this.monitoring) {
                clearInterval(interval);
                return;
            }
            
            const timestamp = new Date().toLocaleTimeString();
            const cpus = os.cpus();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const usagePercent = (usedMem / totalMem) * 100;
            
            let totalIdle = 0;
            let totalTick = 0;
            cpus.forEach(cpu => {
                for (let type in cpu.times) {
                    totalTick += cpu.times[type];
                }
                totalIdle += cpu.times.idle;
            });
            const idle = totalIdle / cpus.length;
            const total = totalTick / cpus.length;
            const cpuUsage = 100 - (100 * idle / total);
            
            console.log(`[${timestamp}] CPU: ${cpuUsage.toFixed(2)}% | RAM: ${usagePercent.toFixed(2)}% | Free: ${(freeMem / (1024 * 1024 * 1024)).toFixed(2)} GB`);
            
            this.stats.cpu.push({
                timestamp: timestamp,
                usage: cpuUsage.toFixed(2)
            });
            
            this.stats.memory.push({
                timestamp: timestamp,
                used: (usedMem / (1024 * 1024 * 1024)).toFixed(2),
                total: (totalMem / (1024 * 1024 * 1024)).toFixed(2),
                usage: usagePercent.toFixed(2)
            });
        }, 2000);
        
        this.rl.question('', () => {
            this.monitoring = false;
            clearInterval(interval);
            this.showMenu();
        });
    }

    exportReport() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `xillen_system_report_${timestamp}.json`;
        
        const report = {
            timestamp: new Date().toISOString(),
            system: {
                platform: os.platform(),
                arch: os.arch(),
                hostname: os.hostname(),
                uptime: os.uptime(),
                totalMemory: os.totalmem(),
                freeMemory: os.freemem(),
                cpus: os.cpus().length
            },
            stats: this.stats
        };
        
        try {
            fs.writeFileSync(filename, JSON.stringify(report, null, 2));
            console.log(`\x1b[32mОтчет сохранен в файл: ${filename}\x1b[0m`);
        } catch (error) {
            console.log(`\x1b[31mОшибка сохранения отчета: ${error.message}\x1b[0m`);
        }
        
        setTimeout(() => this.showMenu(), 2000);
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        let result = '';
        if (days > 0) result += `${days}д `;
        if (hours > 0) result += `${hours}ч `;
        result += `${minutes}м`;
        
        return result;
    }

    exit() {
        console.log('\n\x1b[33mСпасибо за использование XILLEN System Monitor!\x1b[0m');
        this.rl.close();
        process.exit(0);
    }
}

if (require.main === module) {
    const monitor = new XillenSystemMonitor();
    monitor.start();
}

module.exports = XillenSystemMonitor;

