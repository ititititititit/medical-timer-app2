const hourPicker = document.getElementById('hourPicker');
const minutePicker = document.getElementById('minutePicker');

for (let i = 0; i <= 12; i++) {
  const div = document.createElement('div');
  div.textContent = `${i}時間`;
  hourPicker.appendChild(div);
}

for (let i = 0; i <= 59; i++) {
  const div = document.createElement('div');
  div.textContent = `${i}分`;
  minutePicker.appendChild(div);
}

function updateSelected(picker) {
  const items = picker.querySelectorAll('div');
  const scrollTop = picker.scrollTop;
  const itemHeight = 40;
  const index = Math.round(scrollTop / itemHeight);
  items.forEach((el, i) => el.classList.toggle('selected', i === index));
  picker.scrollTo({ top: index * itemHeight, behavior: 'smooth' });
}

hourPicker.addEventListener('scroll', () => setTimeout(() => updateSelected(hourPicker), 100));
minutePicker.addEventListener('scroll', () => setTimeout(() => updateSelected(minutePicker), 100));

setTimeout(() => {
  hourPicker.scrollTo(0, 0);
  minutePicker.scrollTo(0, 0);
  updateSelected(hourPicker);
  updateSelected(minutePicker);
}, 100);

const form = document.getElementById('workForm');
const chartCanvas = document.getElementById('chartCanvas');
let currentChart = null;

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const category = document.getElementById('category').value;
  const hour = parseInt(hourPicker.querySelector('.selected')?.textContent || '0');
  const minute = parseInt(minutePicker.querySelector('.selected')?.textContent || '0');
  const duration = hour * 60 + minute;

  const today = new Date().toISOString().split('T')[0];
  const entry = { date: today, category, duration };
  const data = JSON.parse(localStorage.getItem('workData') || '[]');
  data.push(entry);
  localStorage.setItem('workData', JSON.stringify(data));
  renderDailyChart();
  alert('記録しました');
});

function groupByDate(data) {
  return data.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});
}

function renderDailyChart() {
  const data = JSON.parse(localStorage.getItem('workData') || '[]');
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = data.filter(e => e.date === today);
  const totals = {
    '外来診療': 0, '介護相談': 0, '訪問介護': 0,
    '電子カルテ入力': 0, '書類確認': 0,
    '移動時間': 0, '会議参加': 0
  };
  todayEntries.forEach(e => { if (totals[e.category] !== undefined) totals[e.category] += e.duration; });

  renderChart('doughnut', Object.keys(totals), Object.values(totals), '今日の業務割合');
}

function renderWeeklyChart() {
  const data = JSON.parse(localStorage.getItem('workData') || '[]');
  const grouped = groupByDate(data);
  const now = new Date();
  const result = {};
  const categories = ['外来診療', '介護相談', '訪問介護', '電子カルテ入力', '書類確認', '移動時間', '会議参加'];

  Object.entries(grouped).forEach(([dateStr, entries]) => {
    const diff = (now - new Date(dateStr)) / (1000 * 60 * 60 * 24);
    if (diff <= 6) {
      const label = dateStr.slice(5);
      result[label] = result[label] || Object.fromEntries(categories.map(c => [c, 0]));
      entries.forEach(e => result[label][e.category] += e.duration);
    }
  });

  renderChart('bar', Object.keys(result),
    categories.map(cat => Object.values(result).map(r => r[cat])),
    '週次業務時間', categories
  );
}

function renderMonthlyChart() {
  const data = JSON.parse(localStorage.getItem('workData') || '[]');
  const result = {};
  const categories = ['外来診療', '介護相談', '訪問介護', '電子カルテ入力', '書類確認', '移動時間', '会議参加'];

  data.forEach(entry => {
    const [y, m] = entry.date.split('-');
    const key = `${y}-${m}`;
    result[key] = result[key] || Object.fromEntries(categories.map(c => [c, 0]));
    result[key][entry.category] += entry.duration;
  });

  renderChart('bar', Object.keys(result),
    categories.map(cat => Object.values(result).map(r => r[cat])),
    '月次業務時間', categories
  );
}

function renderChart(type, labels, datasets, title, stackLabels = null) {
  if (currentChart) currentChart.destroy();
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#B2FF66'];
  const dataConfig = {
    labels,
    datasets: Array.isArray(datasets[0])
      ? datasets.map((data, i) => ({ label: stackLabels[i], data, backgroundColor: colors[i % colors.length] }))
      : [{ label: title, data: datasets, backgroundColor: colors }]
  };

  currentChart = new Chart(chartCanvas, {
    type,
    data: dataConfig,
    options: {
      responsive: true,
      plugins: { title: { display: true, text: title } }
    }
  });
}

renderDailyChart();
