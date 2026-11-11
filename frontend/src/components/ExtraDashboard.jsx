import { useEffect, useMemo, useState, useRef } from 'react';
import { api } from '../lib/api.js';

const today = () => new Date().toLocaleDateString('en-CA');
function Panel({title, children}) {return <section className="extra-panel"><h3>{title}</h3>{children}</section>}
export default function ExtraDashboard({tracker, activePanel="analytics"}) {
 const [tasks,setTasks]=useState([]),[calendar,setCalendar]=useState([]),[error,setError]=useState('');
 const [title,setTitle]=useState(''),[priority,setPriority]=useState('medium'),[due,setDue]=useState('');
 const [mode,setMode]=useState('focus'),[remaining,setRemaining]=useState(25*60),[running,setRunning]=useState(false),[subject,setSubject]=useState(''),[note,setNote]=useState('');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[account,setAccount]=useState(null),[authMode,setAuthMode]=useState('login');
 const [theme,setTheme]=useState(()=>localStorage.getItem('tracker-theme')||'light');
 const refresh=()=>Promise.all([api.tasks(),api.calendar()]).then(([t,c])=>{setTasks(t);setCalendar(c)}).catch(e=>setError(e.message));
 useEffect(()=>{refresh()},[]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('tracker-theme',theme)},[theme]);
 useEffect(()=>{if(!running)return;const timer=setInterval(()=>setRemaining(v=>{if(v<=1){setRunning(false);return 0}return v-1}),1000);return()=>clearInterval(timer)},[running]);
 const week=tracker.stats;
 const bySubject=week?.per_subject||[];
 const max=Math.max(1,...bySubject.map(x=>x.minutes));
 const done=tasks.filter(x=>x.status==='done').length;
 const recommendations=useMemo(()=>{
  if(!bySubject.length)return ['Додайте предмет і першу навчальну сесію, щоб отримати персональні поради.'];
  const behind=bySubject.filter(x=>x.minutes<x.goal_minutes).sort((a,b)=>(a.minutes/a.goal_minutes)-(b.minutes/b.goal_minutes));
  return [behind.length?`Найбільше уваги потребує «${behind[0].name}»: ${behind[0].minutes} із ${behind[0].goal_minutes} хв за тиждень.`:'Усі тижневі цілі виконані. Час запланувати нові!',week.streak_days>1?`Серія навчання: ${week.streak_days} днів поспіль.`:'Для серії навчання спробуйте займатися щодня хоча б 10 хвилин.'];
 },[week]);
 async function act(fn){try{setError('');await fn();await refresh()}catch(e){setError(e.message)}}
 const minutes=mode==='focus'?25:5;
 async function saveTimer(){if(!subject)return setError('Виберіть предмет для збереження сесії');await act(async()=>{await api.addSession({subjectId:Number(subject),minutes:minutes,note:note||'Pomodoro',studiedOn:today()});if(tracker.reload)await tracker.reload()});setRunning(false);setRemaining(minutes*60)}
 return <section id="productivity" className="wrap extras"><div className="extras-heading"><span></span><button className="extra-btn" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}>{theme==='dark'?'☀ Світла тема':'☾ Темна тема'}</button></div>
 {error&&<p className="extra-error" role="alert">{error} <button onClick={()=>setError('')}>×</button></p>}
 <div className={`extra-grid extra-only-${activePanel}`}>
 <Panel title="📊 Аналітика навчання"><div className="extra-kpis"><div><strong>{week?.total_minutes||0}</strong><small>хвилин за 7 днів</small></div><div><strong>{week?.streak_days||0}</strong><small>днів поспіль</small></div><div><strong>{done}/{tasks.length}</strong><small>завдань виконано</small></div></div>{bySubject.length?bySubject.map(s=><div className="extra-bar-row" key={s.subject_id}><span>{s.name}</span><b>{s.minutes}/{s.goal_minutes} хв</b><div className="extra-track"><div style={{width:`${Math.min(100,s.minutes/s.goal_minutes*100)}%`}}/></div></div>):<p>Додайте предмети для аналітики.</p>}</Panel>
 <Panel title="⏱ Pomodoro-таймер"><div className="extra-timer">{String(Math.floor(remaining/60)).padStart(2,'0')}:{String(remaining%60).padStart(2,'0')}</div><div className="extra-actions"><button onClick={()=>{setMode('focus');setRemaining(25*60);setRunning(false)}}>Фокус 25 хв</button><button onClick={()=>{setMode('break');setRemaining(5*60);setRunning(false)}}>Перерва 5 хв</button><button className="extra-primary" onClick={()=>setRunning(!running)}>{running?'Пауза':'Старт'}</button><button onClick={()=>{setRunning(false);setRemaining((mode==='focus'?25:5)*60)}}>Скинути</button></div><p className="extra-muted">Після завершення фокус-сесії збережіть її у базі даних.</p><select value={subject} onChange={e=>setSubject(e.target.value)}><option value="">Оберіть предмет</option>{tracker.subjects?.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><input placeholder="Що вивчили?" value={note} onChange={e=>setNote(e.target.value)}/><button className="extra-primary" disabled={mode!=='focus'||remaining!==0} onClick={saveTimer}>Зберегти завершену сесію</button></Panel>
 <Panel title="✅ Завдання та дедлайни"><form className="extra-task-form" onSubmit={e=>{e.preventDefault();if(!title.trim())return;act(()=>api.addTask({title:title.trim(),priority,due_date:due||null}));setTitle('');setDue('')}}><input required maxLength={160} placeholder="Нове завдання" value={title} onChange={e=>setTitle(e.target.value)}/><select value={priority} onChange={e=>setPriority(e.target.value)}><option value="low">Низький</option><option value="medium">Середній</option><option value="high">Високий</option></select><input type="date" value={due} onChange={e=>setDue(e.target.value)}/><button className="extra-primary">Додати</button></form><div className="extra-tasks">{tasks.length?tasks.map(t=><div className="extra-task" key={t.id}><div><strong>{t.title}</strong><small>{t.due_date||'Без дедлайну'} · {t.priority==='high'?'Високий':t.priority==='low'?'Низький':'Середній'} пріоритет</small></div><select aria-label="Статус завдання" value={t.status} onChange={e=>act(()=>api.patchTask(t.id,{status:e.target.value}))}><option value="planned">Заплановано</option><option value="progress">У процесі</option><option value="done">Виконано</option></select><button aria-label="Видалити" onClick={()=>act(()=>api.deleteTask(t.id))}>×</button></div>):<p>Завдань поки немає.</p>}</div></Panel>
 <Panel title="🗓 Календар активності"><p className="extra-muted">Останні 90 днів · темніша клітинка — більше навчання</p><div className="extra-calendar">{calendar.map(d=><span key={d.date} title={`${d.date}: ${d.minutes} хв`} className={'extra-day '+(d.minutes>=120?'d3':d.minutes>=60?'d2':d.minutes>0?'d1':'')}/>)}</div><p className="extra-muted">Активних днів: {calendar.filter(x=>x.minutes>0).length} із {calendar.length}</p></Panel>
 <Panel title="✦ Розумні рекомендації"><p className="extra-muted">Поради на основі фактичної статистики з REST API, без зовнішнього AI.</p>{recommendations.map((r,i)=><p className="extra-tip" key={i}>{r}</p>)}</Panel>
 <Panel title="Профіль">Налаштування профілю доступні у розділі «Профіль».</Panel>
 </div><p className="extra-muted extra-api">Для перевірки лабораторної: <a href="/docs" target="_blank" rel="noreferrer">Swagger / OpenAPI</a> · <a href="/openapi.json" target="_blank" rel="noreferrer">JSON-специфікація</a></p></section>
}
