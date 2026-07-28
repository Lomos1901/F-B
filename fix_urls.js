const fs = require('fs');
const path = require('path');

const dir = 'D:\\SAMCAFFEE\\frontend\\src\\services';
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (!file.endsWith('.ts')) return;
    const filepath = path.join(dir, file);
    let content = fs.readFileSync(filepath, 'utf8');
    
    const regex = /const API_URL = ([^;]+);/;
    const match = content.match(regex);
    if (match) {
        const oldVal = match[1];
        let endpoint = '';
        if (file.toLowerCase().includes('auth')) endpoint = '/auth';
        else if (file.toLowerCase().includes('category')) endpoint = '/categories';
        else if (file.toLowerCase().includes('ingredient')) endpoint = '/ingredients';
        else if (file.toLowerCase().includes('order')) endpoint = '/orders';
        else if (file.toLowerCase().includes('payment')) endpoint = '/payments';
        else if (file.toLowerCase().includes('product')) endpoint = '/products';
        else if (file.toLowerCase().includes('shift')) endpoint = '/shifts';
        else if (file.toLowerCase().includes('stat') || file.toLowerCase().includes('analytic') || file.toLowerCase().includes('dashboard')) endpoint = '/stats';
        else if (file.toLowerCase().includes('user')) endpoint = '/users';
        
        const newVal = '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}' + endpoint + '`';
        content = content.replace(`const API_URL = ${oldVal};`, `const API_URL = ${newVal};`);
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Fixed ${file} with endpoint ${endpoint}`);
    }
});
