'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type Task, type Profile } from '@/lib/types';
import { isToday, isThisWeek, parseISO, isPast, isTomorrow } from 'date-fns';
import { Plus, Check, Circle, Calendar as CalIcon, Building2, Trash2, Navigation } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TasksPage() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allOrgs, setAllOrgs] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState<string>('all');
  
  // New task form
  const [showForm, setShowForm] = useState(false);
  const [newTaskOrgId, setNewTaskOrgId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [assigneeId, setAssigneeId] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profRes, allProfRes, taskRes, orgsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('profiles').select('*').order('full_name', { ascending: true }),
        supabase.from('tasks').select('*, organizations(name)').order('due_date', { ascending: true }),
        supabase.from('organizations').select('id, name').order('name', { ascending: true })
      ]);

      setProfile(profRes.data);
      setAllProfiles(allProfRes.data || []);
      setAllOrgs(orgsRes.data || []);
      setAssigneeId(user.id);
      
      const myProfile = profRes.data;
      const allTasks = taskRes.data || [];
      const isManager = myProfile?.role === 'manager' || myProfile?.full_name === 'เต้ย';
      const visibleTasks = isManager ? allTasks : allTasks.filter(t => t.user_id === user.id);
      
      setTasks(visibleTasks);
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const isManager = profile?.role === 'manager' || profile?.full_name === 'เต้ย';

  const handleToggleTask = async (task: Task) => {
    const newStatus = !task.is_completed;
    
    // Optimistic update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: newStatus } : t));
    
    // Confetti effect if checking a task
    if (newStatus) {
      triggerConfetti();
    }

    await supabase
      .from('tasks')
      .update({ is_completed: newStatus })
      .eq('id', task.id);
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('ลบงานนี้หรือไม่?')) return;
    setTasks(tasks.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setSavingTask(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('tasks')
        .insert({
          user_id: assigneeId || user.id,
          org_id: newTaskOrgId || null,
          title: newTaskTitle.trim(),
          location: newTaskLocation.trim() || null,
          due_date: newTaskDate,
          is_completed: false
        })
        .select('*, organizations(name)')
        .single();
        
      if (data) {
        setTasks([...tasks, data].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()));
        setNewTaskTitle('');
        setNewTaskOrgId('');
        setNewTaskLocation('');
        setShowForm(false);
      }
    }
    setSavingTask(false);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6']
    });
  };

  // Filter by user if manager
  const displayTasks = (isManager && filterUser !== 'all') ? tasks.filter(t => t.user_id === filterUser) : tasks;

  // Group tasks
  const todayTasks = displayTasks.filter(t => !t.is_completed && (isToday(parseISO(t.due_date)) || (isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)))));
  const upcomingTasks = displayTasks.filter(t => !t.is_completed && !todayTasks.includes(t) && isThisWeek(parseISO(t.due_date)));
  const laterTasks = displayTasks.filter(t => !t.is_completed && !todayTasks.includes(t) && !upcomingTasks.includes(t));
  const completedTasks = displayTasks.filter(t => t.is_completed).sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()).slice(0, 5);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'สวัสดีตอนเช้า ☀️';
    if (hour < 18) return 'สวัสดีตอนบ่าย ⛅';
    return 'สวัสดีตอนเย็น 🌙';
  };

  if (loading) return <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-20">
      {/* Friendly Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            {getGreeting()} {profile?.full_name ? `${profile.full_name}!` : ''}
          </h1>
          <p className="text-blue-100 text-lg">
            วันนี้คุณมีงานที่ต้องทำ <span className="font-bold text-white text-xl mx-1">{todayTasks.length}</span> อย่าง ✌️
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">รายการงาน</h2>
          {isManager && (
            <select 
              className="input-field py-1.5 px-3 text-sm min-w-[150px] bg-blue-50 border-blue-200 text-blue-700" 
              value={filterUser} 
              onChange={(e) => setFilterUser(e.target.value)}
            >
              <option value="all">ดูงานของทุกคน</option>
              {allProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          )}
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn-primary shadow-sm rounded-full px-5"
        >
          <Plus size={18} />
          เพิ่มงานใหม่
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-8 animate-fade-in border-2 border-blue-100">
          <form onSubmit={handleAddTask} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="label">องค์กร (เพื่อดึงชื่องาน)</label>
                <select 
                  className="input-field py-2.5" 
                  value={newTaskOrgId}
                  onChange={(e) => {
                    const orgId = e.target.value;
                    setNewTaskOrgId(orgId);
                    const orgName = allOrgs.find(o => o.id === orgId)?.name;
                    if (orgName) setNewTaskTitle(`ติดต่อ ${orgName}`);
                  }}
                >
                  <option value="">- เลือกองค์กร (ไม่บังคับ) -</option>
                  {allOrgs.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="label">ชื่องาน <span className="text-red-500">*</span></label>
                <input 
                  className="input-field py-2.5" 
                  placeholder="เช่น โทรติดตามลูกค้า A..." 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus
                  required 
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="label">สถานที่ / ตำแหน่ง</label>
                <input 
                  className="input-field py-2.5" 
                  placeholder="ระบุพิกัด หรือสถานที่..." 
                  value={newTaskLocation}
                  onChange={(e) => setNewTaskLocation(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-40">
              <label className="label">วันที่</label>
              <input 
                type="date" 
                className="input-field py-2.5" 
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                required 
              />
            </div>
            {isManager && (
              <div className="w-full sm:w-40">
                <label className="label">มอบหมายให้</label>
                <select 
                  className="input-field py-2.5" 
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  required
                >
                  {allProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="w-full sm:w-auto flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-2.5 px-4 flex-1">ยกเลิก</button>
              <button type="submit" className="btn-primary py-2.5 px-6 flex-1" disabled={savingTask}>
                {savingTask ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Today column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">🔥</div>
            <h3 className="text-lg font-bold text-gray-900">งานวันนี้ / ค้างจัด</h3>
            <span className="badge bg-gray-100 text-gray-600 ml-auto">{todayTasks.length}</span>
          </div>

          {todayTasks.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-400 border-dashed border-2">
              <p>ยอดเยี่ยม! ไม่มีงานค้างสำหรับวันนี้ 🎉</p>
            </div>
          ) : (
            todayTasks.map(task => <TaskCard key={task.id} task={task} onToggle={() => handleToggleTask(task)} onDelete={() => handleDeleteTask(task.id)} isTodaySection assigneeName={allProfiles.find(p => p.id === task.user_id)?.full_name} />)
          )}
        </div>

        {/* This week column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">📅</div>
            <h3 className="text-lg font-bold text-gray-900">งานในสัปดาห์นี้</h3>
            <span className="badge bg-gray-100 text-gray-600 ml-auto">{upcomingTasks.length}</span>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-400 border-dashed border-2">
              <p>ยังไม่มีงานสำหรับสัปดาห์นี้</p>
            </div>
          ) : (
            upcomingTasks.map(task => <TaskCard key={task.id} task={task} onToggle={() => handleToggleTask(task)} onDelete={() => handleDeleteTask(task.id)} assigneeName={allProfiles.find(p => p.id === task.user_id)?.full_name} />)
          )}

          {laterTasks.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-4 mb-2">
                <h3 className="text-md font-bold text-gray-600">งานล่วงหน้า</h3>
              </div>
              {laterTasks.map(task => <TaskCard key={task.id} task={task} onToggle={() => handleToggleTask(task)} onDelete={() => handleDeleteTask(task.id)} compact assigneeName={allProfiles.find(p => p.id === task.user_id)?.full_name} />)}
            </>
          )}
          
          {completedTasks.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-4 mb-2">
                <h3 className="text-md font-bold text-gray-500">เสร็จสิ้นล่าสุด</h3>
              </div>
              {completedTasks.map(task => <TaskCard key={task.id} task={task} onToggle={() => handleToggleTask(task)} onDelete={() => handleDeleteTask(task.id)} compact assigneeName={allProfiles.find(p => p.id === task.user_id)?.full_name} />)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ 
  task, 
  onToggle, 
  onDelete,
  isTodaySection = false,
  compact = false,
  assigneeName = ''
}: { 
  task: Task, 
  onToggle: () => void, 
  onDelete: () => void,
  isTodaySection?: boolean,
  compact?: boolean,
  assigneeName?: string
}) {
  const overdue = !task.is_completed && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
  
  return (
    <div 
      className={`glass-card p-4 flex gap-4 items-start group transition-all duration-300 ${
        task.is_completed ? 'opacity-50 grayscale bg-gray-50' : 'hover:shadow-md hover:border-blue-200'
      } ${overdue ? 'border-l-4 border-l-red-500' : ''}`}
    >
      <button 
        onClick={onToggle}
        className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          task.is_completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-transparent hover:border-blue-500 hover:text-blue-200'
        }`}
      >
        <Check size={14} strokeWidth={3} />
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-gray-900 ${task.is_completed ? 'line-through text-gray-500' : ''} ${compact ? 'text-sm' : 'text-base'}`}>
          {task.title}
        </p>
        
        {!compact && (
          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            <span className={`flex items-center gap-1 font-medium ${
              overdue ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded' : 
              isTodaySection ? 'text-orange-600' : 'text-gray-500'
            }`}>
              <CalIcon size={12} />
              {overdue ? 'เลยกำหนดแล้ว' : 
               isTodaySection ? 'วันนี้' : 
               new Intl.DateTimeFormat('th-TH', { weekday: 'short', day: 'numeric', month: 'short' }).format(parseISO(task.due_date))}
            </span>
            
            {task.organizations?.name && (
              <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                <Building2 size={12} />
                {task.organizations.name}
              </span>
            )}

            {task.location && (
              <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                <Navigation size={12} />
                {task.location}
              </span>
            )}
            
            {assigneeName && (
              <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-medium">
                👤 {assigneeName}
              </span>
            )}
          </div>
        )}
      </div>

      <button 
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity shrink-0"
        title="ลบงาน"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
