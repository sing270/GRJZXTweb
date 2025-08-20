document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav i[data-tab]');
    const contentBoxes = document.querySelectorAll('.card .box');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetId = this.getAttribute('data-tab');

            localStorage.setItem('activeTabId', targetId);

            contentBoxes.forEach(box => {
                box.classList.remove('active');
                box.style.display = 'none';
            });
            
            const targetBox = document.getElementById(targetId);
            if (targetBox) {
                targetBox.classList.add('active');
                targetBox.style.display = 'block';
            }
            
            navItems.forEach(nav => {
                nav.classList.remove('active');
            });

            this.classList.add('active');
        });
    });

    const savedTabId = localStorage.getItem('activeTabId');
    let initialTabId = null;
    
    if (savedTabId) {
        const savedBox = document.getElementById(savedTabId);
        if (savedBox) {
            initialTabId = savedTabId;
        }
    }

    if (contentBoxes.length > 0) {
        contentBoxes.forEach(box => {
            box.classList.remove('active');
            box.style.display = 'none';
        });

        const initialBox = initialTabId ? document.getElementById(initialTabId) : contentBoxes[0];
        initialBox.style.display = 'block';
        initialBox.classList.add('active');
    }

    if (navItems.length > 0) {
        navItems.forEach(nav => nav.classList.remove('active'));
        const initialNav = initialTabId 
            ? document.querySelector(`.nav i[data-tab="${initialTabId}"]`) 
            : navItems[0];
        initialNav.classList.add('active');
    }

    initDateTime();
    setInterval(initDateTime, 1000);

    initTabs();

    initForm();

    loadRecords();
    updateSummary();
});

function initDateTime() {
    const now = new Date();
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const dateStr = now.toLocaleDateString('zh-CN', options).replace(/\//g, '-');
    const weekday = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    document.getElementById('currentDate').textContent = dateStr;
    document.getElementById('currentweekday').textContent = `星期${weekday}`;
    document.getElementById('currentTime').textContent = timeStr;

    if (!document.getElementById('date').value) {
        const dateInput = now.toISOString().split('T')[0];
        const timeInput = now.toTimeString().split(' ')[0].slice(0, 8);
        document.getElementById('date').value = dateInput;
        document.getElementById('time').value = timeInput;
    }
}

function initTabs() {
    const tabTriggers = document.querySelectorAll('.nav [data-tab]');
    const tabContents = document.querySelectorAll('.box');

    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');

            tabContents.forEach(tab => {
                tab.classList.remove('active');
            });

            document.getElementById(tabId).classList.add('active');
        });
    });
}

function initForm() {
    document.getElementById('recodeSave').addEventListener('click', saveRecord);
    
    document.getElementById('recodeReset').addEventListener('click', resetForm);

    document.getElementById('search').addEventListener('input', searchRecords);
}

function saveRecord() {
    const purpose = document.getElementById('purpose').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.querySelector('input[name="type"]:checked')?.value;
    const source = document.getElementById('source').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const remark = document.getElementById('remark').value.trim();

    if (!purpose) {
        alert('请输入用途');
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        alert('请输入有效的金额');
        return;
    }
    if (!type) {
        alert('请选择收支类型');
        return;
    }
    if (!source) {
        alert('请选择收支途径');
        return;
    }

    const record = {
        id: Date.now().toString(),
        purpose,
        amount,
        type,
        source,
        date,
        time,
        remark,
        createTime: new Date().toISOString()
    };

    const records = JSON.parse(localStorage.getItem('financeRecords') || '[]');
    records.push(record);

    localStorage.setItem('financeRecords', JSON.stringify(records));

    loadRecords();
    updateSummary();
    resetForm();
    
    alert('记录保存成功！');
}

function resetForm() {
    document.getElementById('purpose').value = '';
    document.getElementById('amount').value = '';
    document.querySelectorAll('input[name="type"]').forEach(radio => radio.checked = false);
    document.getElementById('source').value = '';
    
    const now = new Date();
    document.getElementById('date').value = now.toISOString().split('T')[0];
    document.getElementById('time').value = now.toTimeString().split(' ')[0].slice(0, 8);
    
    document.getElementById('remark').value = '';
}

function loadRecords(filter = null) {
    const records = JSON.parse(localStorage.getItem('financeRecords') || '[]');
    const tableBody = document.getElementById('overviewTableList');
    tableBody.innerHTML = '';

    const sortedRecords = records.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
  
    const displayRecords = filter 
        ? sortedRecords.filter(record => 
            record.purpose.includes(filter) || 
            record.remark.includes(filter) ||
            record.source.includes(filter) ||
            record.type.includes(filter) ||
            record.date.includes(filter)
          )
        : sortedRecords;

    displayRecords.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.date}</td>
            <td>${record.time}</td>
            <td>${record.source}</td>
            <td class="${record.type === 'income' ? 'type-income' : 'type-expense'}">
                ${record.type === 'income' ? '收入' : '支出'}
            </td>
            <td class="${record.type === 'income' ? 'type-income' : 'type-expense'}">
                ${record.type === 'income' ? '+' : '-'}${record.amount.toFixed(2)}
            </td>
            <td>${record.remark || '-'}</td>
            <td>
                <button class="edit-btn" data-id="${record.id}">
                    <i class="fa fa-edit"></i> 编辑
                </button>
                <button class="delete-btn" data-id="${record.id}">
                    <i class="fa fa-trash"></i> 删除
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            editRecord(this.getAttribute('data-id'));
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('确定要删除这条记录吗？')) {
                deleteRecord(this.getAttribute('data-id'));
            }
        });
    });
}

function searchRecords(e) {
    const searchTerm = e.target.value.trim();
    loadRecords(searchTerm);
}

function editRecord(id) {
    const records = JSON.parse(localStorage.getItem('financeRecords') || '[]');
    const record = records.find(r => r.id === id);
    
    if (!record) return;

    document.getElementById('purpose').value = record.purpose;
    document.getElementById('amount').value = record.amount;
    document.querySelector(`input[name="type"][value="${record.type}"]`).checked = true;
    document.getElementById('source').value = record.source;
    document.getElementById('date').value = record.date;
    document.getElementById('time').value = record.time;
    document.getElementById('remark').value = record.remark;

    deleteRecord(id, false);

    document.querySelector('[data-tab="recodeBox"]').click();
}

function deleteRecord(id, showAlert = true) {
    let records = JSON.parse(localStorage.getItem('financeRecords') || '[]');
    records = records.filter(r => r.id !== id);
    
    localStorage.setItem('financeRecords', JSON.stringify(records));
    loadRecords();
    updateSummary();
    
    if (showAlert) {
        alert('记录已删除');
    }
}

function updateSummary() {
    const records = JSON.parse(localStorage.getItem('financeRecords') || '[]');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalIncome = 0;
    let totalExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;
    const sources = {
        '余额宝': 0,
        '零钱通': 0,
        '建信': 0,
        '黄金': 0
    };

    records.forEach(record => {
        const recordDate = new Date(record.date);
        const amount = parseFloat(record.amount);

        if (record.type === 'income') {
            totalIncome += amount;
        } else {
            totalExpense += amount;
        }

        if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
            if (record.type === 'income') {
                monthIncome += amount;
            } else {
                monthExpense += amount;
            }
        }

        if (sources.hasOwnProperty(record.source)) {
            if (record.type === 'income') {
                sources[record.source] += amount;
            } else {
                sources[record.source] -= amount;
            }
        }
    });

    document.getElementById('income').textContent = `¥${totalIncome.toFixed(2)}`;
    document.getElementById('expense').textContent = `¥${totalExpense.toFixed(2)}`;
    document.querySelector('.surplus').textContent = `¥${(totalIncome - totalExpense).toFixed(2)}`;
    
    document.querySelector('.monthIncomne').textContent = `¥${monthIncome.toFixed(2)}`;
    document.querySelector('.monthExpense').textContent = `¥${monthExpense.toFixed(2)}`;
    document.querySelector('.monthSurplus').textContent = `¥${(monthIncome - monthExpense).toFixed(2)}`;

    document.querySelectorAll('.showCard').forEach(card => {
        const title = card.querySelector('.showCardHeaderP').textContent;
        if (sources.hasOwnProperty(title)) {
            card.querySelector('h3').textContent = `¥${sources[title].toFixed(2)}`;
        }
    });
}

