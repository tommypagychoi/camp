const calendarGrid=document.querySelector('#calendarGrid');
const currentMonthLabel=document.querySelector('#currentMonth');
const prevMonthButton=document.querySelector('#prevMonth');
const nextMonthButton=document.querySelector('#nextMonth');
let visibleDate=new Date();visibleDate.setDate(1);
const inventory=[{key:'원터치 텐트',label:'원터치 텐트'},{key:'타프',label:'타프'},{key:'패키지 예약',label:'패키지 예약'}];
const fixedBookedStart='2026-06-04';
const fixedBookedEnd='2026-06-08';
function toDateKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function touches(r,day){return r.startDate<=day&&r.endDate>=day}
function uses(r,item){const e=r.equipment||[];return e.some(x=>String(x).includes(item.key))}
function isFixedBooked(day){return day>=fixedBookedStart&&day<=fixedBookedEnd}
async function fetchReservations(d){const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const res=await fetch(`/api/reservations?month=${y}-${m}`);if(!res.ok)throw new Error('예약 정보를 불러오지 못했습니다.');return res.json()}
function renderCalendar(reservations){const y=visibleDate.getFullYear();const m=visibleDate.getMonth();const first=new Date(y,m,1);const last=new Date(y,m+1,0);const cells=[];currentMonthLabel.innerHTML=`<span>${y}</span> 년 <b>${m+1}</b> 월`;['일요일','월요일','화요일','수요일','목요일','금요일','토요일'].forEach((d,i)=>cells.push(`<div class="calendar-weekday ${i===0?'sunday':i===6?'saturday':''}">${d}</div>`));for(let i=0;i<first.getDay();i++)cells.push('<div class="calendar-day muted"></div>');for(let day=1;day<=last.getDate();day++){const date=new Date(y,m,day);const key=toDateKey(date);const blocked=isFixedBooked(key);const dayReservations=reservations.filter(r=>touches(r,key));const items=inventory.map(item=>{const matched=dayReservations.filter(r=>uses(r,item));const hasConfirmed=matched.some(r=>r.status==='confirmed'||r.paymentStatus==='paid');const hasPending=matched.some(r=>r.status==='pending'&&r.paymentStatus!=='paid');if(blocked||hasConfirmed){return `<span class="calendar-item confirmed unavailable"><span class="doc-icon">▤</span>${item.label} 예약완료</span>`}if(hasPending){return `<a class="calendar-item pending" href="reserve.html?date=${key}&item=${encodeURIComponent(item.key)}"><span class="doc-icon">▤</span>${item.label} 예약대기</a>`}return `<a class="calendar-item available" href="reserve.html?date=${key}&item=${encodeURIComponent(item.key)}"><span class="doc-icon">▤</span>${item.label} 예약가능</a>`}).join('');const type=date.getDay()===0?'sunday':date.getDay()===6?'saturday':'';cells.push(`<div class="calendar-day ${type} ${blocked?'booked-day':''}"><strong class="day-number">${day}</strong><div class="reservation-list">${items}</div></div>`)}calendarGrid.innerHTML=cells.join('')}
async function refreshCalendar(){calendarGrid.innerHTML='<div class="calendar-loading">예약 정보를 불러오는 중입니다.</div>';try{renderCalendar(await fetchReservations(visibleDate))}catch{renderCalendar([])}}
prevMonthButton.addEventListener('click',()=>{visibleDate=new Date(visibleDate.getFullYear(),visibleDate.getMonth()-1,1);refreshCalendar()});
nextMonthButton.addEventListener('click',()=>{visibleDate=new Date(visibleDate.getFullYear(),visibleDate.getMonth()+1,1);refreshCalendar()});
refreshCalendar();
