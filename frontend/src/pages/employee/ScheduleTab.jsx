import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plane,
  CheckCircle2,
  Circle,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Bell,
  Sun,
  Moon,
  BarChart3,
  CalendarCheck,
  X,
  Sparkles,
  ArrowRight,
  Check,
  TrendingUp,
  Tag,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const INITIAL_SCHEDULE = {
  leaveBalance: 12,
  workHours: '40h',
  workHoursDiff: '↑ 2h',
  status: 'On Time',
  todos: [
    { id: 1, text: 'Review threat intelligence report', time: 'Today • 9:30 AM', completed: true },
    { id: 2, text: 'Prepare presentation for client call', time: 'Today • 1:00 PM', completed: true },
    { id: 3, text: 'Update project roadmap', time: 'Today • 4:00 PM', completed: false },
    { id: 4, text: "Check team's weekly updates", time: 'Tomorrow • 10:00 AM', completed: false }
  ],
  events: [
    { id: 'e1', title: 'Team Standup', time: '9:00 - 9:30 AM', day: 'Mon', color: 'green', type: 'Meeting' },
    { id: 'e2', title: 'Security Review', time: '11:00 - 12:00 PM', day: 'Mon', color: 'green', type: 'Meeting' },
    { id: 'e3', title: 'Design Sync', time: '3:00 - 4:00 PM', day: 'Mon', color: 'purple', type: 'Meeting' },
    { id: 'e4', title: 'Product Sync', time: '10:00 - 11:00 AM', day: 'Tue', color: 'green', type: 'Meeting' },
    { id: 'e5', title: 'Project Update', time: '2:00 - 3:00 PM', day: 'Tue', color: 'peach', type: 'Task' },
    { id: 'e6', title: 'Client Call', time: '9:30 - 10:30 AM', day: 'Wed', color: 'purple', type: 'Meeting' },
    { id: 'e7', title: 'Research', time: '1:00 - 2:00 PM', day: 'Wed', color: 'green', type: 'Task' },
    { id: 'e8', title: 'Engineering', time: '11:00 - 12:00 PM', day: 'Thu', color: 'green', type: 'Meeting' },
    { id: 'e9', title: 'Team Retro', time: '3:00 - 4:00 PM', day: 'Thu', color: 'purple', type: 'Meeting' },
    { id: 'e10', title: 'Product Review', time: '10:00 - 11:00 AM', day: 'Fri', color: 'green', type: 'Meeting' },
    { id: 'e11', title: 'Planning', time: '2:00 - 3:00 PM', day: 'Fri', color: 'peach', type: 'Task' }
  ]
};

const DAYS = [
  { key: 'Mon', name: 'Mon', date: 'Nov 24' },
  { key: 'Tue', name: 'Tue', date: 'Nov 25' },
  { key: 'Wed', name: 'Wed', date: 'Nov 26' },
  { key: 'Thu', name: 'Thu', date: 'Nov 27' },
  { key: 'Fri', name: 'Fri', date: 'Nov 28' }
];

const TIME_SLOTS = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'];

export default function ScheduleTab() {
  const { user } = useAuth();
  const userName = user?.full_name ? user.full_name.split(' ')[0] : 'Sai';

  // Persistence in localStorage
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('cognisec_employee_schedule_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SCHEDULE;
  });

  useEffect(() => {
    try {
      localStorage.setItem('cognisec_employee_schedule_v1', JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data]);

  // Views & Filters
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
  const [weekOffset, setWeekOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Modals
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Leave Form State
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState('');

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDay, setNewEventDay] = useState('Mon');
  const [newEventTime, setNewEventTime] = useState('10:00 - 11:00 AM');
  const [newEventType, setNewEventType] = useState('Meeting');
  const [newEventColor, setNewEventColor] = useState('green');

  // New To-Do inline state
  const [newTodoText, setNewTodoText] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);

  // Toggle To-Do
  function handleToggleTodo(id) {
    setData((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    }));
  }

  // Add To-Do
  function handleAddTodo(e) {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const newTodo = {
      id: Date.now(),
      text: newTodoText.trim(),
      time: 'Today • Just now',
      completed: false
    };
    setData((prev) => ({ ...prev, todos: [newTodo, ...prev.todos] }));
    setNewTodoText('');
    setIsAddingTodo(false);
  }

  // Submit Leave Request
  function handleRequestLeave(e) {
    e.preventDefault();
    const daysToDeduct = parseInt(leaveDays, 10) || 1;
    if (data.leaveBalance < daysToDeduct) {
      alert('Insufficient leave balance available.');
      return;
    }
    setData((prev) => ({
      ...prev,
      leaveBalance: Math.max(0, prev.leaveBalance - daysToDeduct)
    }));
    setLeaveSuccessMsg(`Successfully booked ${daysToDeduct} day(s) of ${leaveType}!`);
    setTimeout(() => {
      setLeaveSuccessMsg('');
      setLeaveModalOpen(false);
    }, 1400);
  }

  // Add Calendar Event
  function handleAddEvent(e) {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const newEv = {
      id: 'e_' + Date.now(),
      title: newEventTitle.trim(),
      day: newEventDay,
      time: newEventTime,
      type: newEventType,
      color: newEventColor
    };
    setData((prev) => ({
      ...prev,
      events: [...prev.events, newEv]
    }));
    setNewEventTitle('');
    setEventModalOpen(false);
  }

  // Delete Calendar Event
  function handleDeleteEvent(id) {
    setData((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id)
    }));
    setSelectedEvent(null);
  }

  // Filtered Events
  const filteredEvents = data.events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || ev.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  // Calculate upcoming events for the sidebar widget
  const upcomingEvents = [
    { title: 'Product Sync', time: 'Today • 10:30 AM', type: 'Meeting', color: 'green' },
    { title: 'Team Retro', time: 'Today • 3:00 PM', type: 'Meeting', color: 'purple' },
    { title: 'Project Update', time: 'Tomorrow • 2:00 PM', type: 'Task', color: 'peach' }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* ── Top Bar: Search, Notification, Theme ────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Search Input with ⌘K badge */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anything..."
            className="w-full pl-10 pr-12 py-2 text-xs sm:text-[13px] rounded-full bg-white/90 border border-stone-200/80 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0D3829]/20 focus:border-[#0D3829] transition-all placeholder:text-stone-400"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
            ⌘ K
          </kbd>
        </div>

        {/* Top Right Controls: Notifications & Light/Dark */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white/90 border border-stone-200/80 flex items-center justify-center text-charcoal/70 hover:text-charcoal hover:shadow-2xs transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white" />
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white/90 border border-stone-200/80 flex items-center justify-center text-charcoal/70 hover:text-charcoal hover:shadow-2xs transition-all"
            title="Toggle theme"
          >
            <Sun className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Greeting Banner with Mountain Illustration ─────────────── */}
      <div className="relative bg-gradient-to-r from-[#F4EFE6]/90 via-[#FAF7F2]/90 to-[#EAE6DF]/70 rounded-3xl p-6 sm:p-8 border border-stone-200/60 shadow-2xs overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C2826] flex items-center gap-2.5">
            <span>Good morning, {userName}!</span>
            <span className="text-2xl">🌿</span>
          </h1>
          <p className="mt-1 text-sm text-stone-600 font-medium">
            Here's what's on your plate today.
          </p>
        </div>

        {/* Right side illustration: Mountain with Flag & "You've got this! 彡" */}
        <div className="absolute right-0 bottom-0 top-0 pointer-events-none select-none hidden md:flex items-center justify-end h-full pr-2">
          <img
            src="/schedule-banner.png"
            alt="You've got this!"
            className="h-full max-h-[140px] w-auto object-contain opacity-95"
          />
        </div>
      </div>

      {/* ── 4 Top Metric Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Work Hours */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-stone-200/70 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group">
          <div className="flex items-center gap-2 text-stone-500 text-xs font-medium">
            <CalendarIcon className="w-4 h-4 text-stone-400" />
            <span>Work Hours (This Week)</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-charcoal">{data.workHours}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
              {data.workHoursDiff}
            </span>
          </div>
          {/* Subtle wave sparkline decoration */}
          <div className="absolute right-2 -bottom-2 w-24 h-12 opacity-30 pointer-events-none text-emerald-500">
            <svg viewBox="0 0 100 40" fill="none" className="w-full h-full">
              <path
                d="M0 30 Q 25 10, 50 25 T 100 15 L 100 40 L 0 40 Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Leave Balance */}
        <button
          type="button"
          onClick={() => setLeaveModalOpen(true)}
          className="text-left bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-stone-200/70 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between cursor-pointer group"
        >
          <div>
            <div className="flex items-center gap-2 text-stone-500 text-xs font-medium">
              <Plane className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 transition-colors" />
              <span>Leave Balance</span>
            </div>
            <div className="mt-3 text-2xl font-bold text-charcoal">
              {data.leaveBalance} <span className="text-sm font-normal text-stone-500">days</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Card 3: Next Meeting */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-stone-200/70 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-stone-500 text-xs font-medium">
              <Clock className="w-4 h-4 text-stone-400" />
              <span>Next Meeting</span>
            </div>
            <div className="mt-2.5">
              <span className="text-xl font-bold text-charcoal block">10:30 AM</span>
              <span className="text-xs text-stone-500 font-medium">Product Sync</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400" />
        </div>

        {/* Card 4: Status */}
        <button
          type="button"
          onClick={() => setAvailabilityModalOpen(true)}
          className="text-left bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-stone-200/70 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between cursor-pointer group"
        >
          <div>
            <div className="flex items-center gap-2 text-stone-500 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>Status</span>
            </div>
            <div className="mt-3 text-xl font-bold text-charcoal group-hover:text-emerald-800 transition-colors">
              {data.status}
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <Check className="w-4 h-4 stroke-[2.5]" />
          </div>
        </button>
      </div>

      {/* ── Main Schedule Grid + Right Column (To-Do & Upcoming) ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Schedule Calendar (2 cols) */}
        <div className="lg:col-span-2 bg-white/85 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-stone-200/70 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Header: Title + Navigation + Week/Month Switch */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-stone-200/60">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-5 h-5 text-[#0D3829]" />
                <h2 className="text-base sm:text-lg font-bold text-charcoal">My Schedule</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
                {/* Week Selector */}
                <div className="flex items-center bg-stone-100/90 rounded-full px-2 py-1 text-xs font-medium text-stone-700 border border-stone-200/80">
                  <button
                    type="button"
                    onClick={() => setWeekOffset((p) => p - 1)}
                    className="p-1 hover:text-black hover:bg-white rounded-full transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2">
                    {weekOffset === 0 ? 'This Week' : weekOffset > 0 ? `+${weekOffset} Weeks` : `${weekOffset} Weeks`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setWeekOffset((p) => p + 1)}
                    className="p-1 hover:text-black hover:bg-white rounded-full transition-all"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Week / Month Toggle */}
                <div className="flex items-center bg-stone-100 p-0.5 rounded-full border border-stone-200/80 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      viewMode === 'week'
                        ? 'bg-[#0D3829] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      viewMode === 'month'
                        ? 'bg-[#0D3829] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Month
                  </button>
                </div>

                {/* Add Event Button */}
                <button
                  type="button"
                  onClick={() => setEventModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 rounded-full flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* View Mode: Week Calendar */}
            {viewMode === 'week' ? (
              <div className="mt-4 overflow-x-auto">
                <div className="min-w-[580px]">
                  {/* Days Header */}
                  <div className="grid grid-cols-6 text-center text-xs pb-3 border-b border-stone-100">
                    <span className="font-semibold text-stone-400 uppercase text-[11px] text-left pl-2">
                      Time
                    </span>
                    {DAYS.map((d) => (
                      <div key={d.key} className="space-y-0.5">
                        <span className="block font-semibold text-charcoal">{d.name}</span>
                        <span className="block text-[11px] text-stone-400 font-medium">
                          {d.date}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Hourly Grid Rows */}
                  <div className="divide-y divide-stone-100">
                    {TIME_SLOTS.map((slot) => (
                      <div key={slot} className="grid grid-cols-6 min-h-[58px] py-1.5 items-start">
                        {/* Time Label */}
                        <div className="text-[11px] font-semibold text-stone-400 pt-1.5 pl-2">
                          {slot}
                        </div>

                        {/* Mon - Fri Slot Columns */}
                        {DAYS.map((d) => {
                          const slotEvents = filteredEvents.filter((ev) => {
                            if (ev.day !== d.key) return false;
                            // Match slot hour prefix
                            const evHour = ev.time.split(':')[0];
                            const slotHour = slot.split(':')[0];
                            return evHour === slotHour;
                          });

                          return (
                            <div key={d.key} className="px-1 min-h-[50px] flex flex-col gap-1">
                              {slotEvents.map((ev) => {
                                const isGreen = ev.color === 'green';
                                const isPurple = ev.color === 'purple';
                                const isPeach = ev.color === 'peach';

                                return (
                                  <div
                                    key={ev.id}
                                    onClick={() => setSelectedEvent(ev)}
                                    className={`rounded-xl p-2 text-left cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xs border ${
                                      isGreen
                                        ? 'bg-[#EAF5EE] border-[#CDE5D5] text-[#1E4D30]'
                                        : isPurple
                                        ? 'bg-[#EFEAFF] border-[#D9CFFE] text-[#473B80]'
                                        : 'bg-[#FDF2E9] border-[#F8DEC7] text-[#8C4E23]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 font-semibold text-xs leading-tight">
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          isGreen
                                            ? 'bg-emerald-600'
                                            : isPurple
                                            ? 'bg-purple-600'
                                            : 'bg-amber-600'
                                        }`}
                                      />
                                      <span className="truncate">{ev.title}</span>
                                    </div>
                                    <span className="block text-[10px] opacity-75 font-mono mt-0.5 pl-3">
                                      {ev.time}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Month Calendar View */
              <div className="mt-4 p-4 text-center">
                <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-stone-500 mb-2">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>
                <div className="grid grid-cols-7 gap-2 text-xs">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const dayNum = i + 1;
                    const hasEvent = dayNum === 24 || dayNum === 25 || dayNum === 26 || dayNum === 27;
                    return (
                      <div
                        key={dayNum}
                        className={`h-16 rounded-xl border p-1 text-left transition-all ${
                          hasEvent
                            ? 'bg-emerald-50/70 border-emerald-200/80 font-bold text-emerald-900'
                            : 'bg-stone-50/50 border-stone-200/40 text-stone-600'
                        }`}
                      >
                        <span className="text-[11px] block">{dayNum}</span>
                        {hasEvent && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: My To-Do + Upcoming Events */}
        <div className="space-y-6">
          {/* My To-Do Card */}
          <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-stone-200/70 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <h3 className="text-sm font-bold text-charcoal">My To-Do</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingTodo(!isAddingTodo)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <span>+ Add</span>
              </button>
            </div>

            {/* Inline Add Task Form */}
            {isAddingTodo && (
              <form onSubmit={handleAddTodo} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="Task title..."
                  autoFocus
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#0D3829] text-white text-xs font-semibold rounded-xl hover:bg-[#154E3A]"
                >
                  Save
                </button>
              </form>
            )}

            {/* Checklist */}
            <div className="mt-3.5 space-y-3">
              {data.todos.map((todo) => (
                <div
                  key={todo.id}
                  onClick={() => handleToggleTodo(todo.id)}
                  className="flex items-start gap-2.5 cursor-pointer group select-none"
                >
                  <button
                    type="button"
                    className="mt-0.5 text-stone-400 group-hover:text-emerald-700 transition-colors"
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-4 h-4 text-stone-300" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs block font-medium leading-tight ${
                        todo.completed
                          ? 'line-through text-stone-400'
                          : 'text-stone-800 group-hover:text-black'
                      }`}
                    >
                      {todo.text}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">
                      {todo.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events Card */}
          <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-stone-200/70 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#0D3829]" />
                <h3 className="text-sm font-bold text-charcoal">Upcoming Events</h3>
              </div>
              <button
                type="button"
                onClick={() => setEventModalOpen(true)}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1"
              >
                <span>See all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3">
              {upcomingEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        evt.color === 'green'
                          ? 'bg-emerald-500'
                          : evt.color === 'purple'
                          ? 'bg-purple-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-charcoal block truncate">
                        {evt.title}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono block">
                        {evt.time}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      evt.type === 'Meeting'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {evt.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Quick Actions + Encouragement Banner ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions (1 col) */}
        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-stone-200/70 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-200/60">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-charcoal">Quick Actions</h3>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setLeaveModalOpen(true)}
              className="p-3 rounded-2xl bg-stone-50/80 hover:bg-emerald-50/80 border border-stone-200/60 hover:border-emerald-200 transition-all flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer"
            >
              <Plane className="w-4 h-4 text-stone-600 group-hover:text-emerald-700 transition-colors" />
              <span className="text-xs font-medium text-stone-700 group-hover:text-emerald-900">
                Request Leave
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAvailabilityModalOpen(true)}
              className="p-3 rounded-2xl bg-stone-50/80 hover:bg-emerald-50/80 border border-stone-200/60 hover:border-emerald-200 transition-all flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer"
            >
              <Clock className="w-4 h-4 text-stone-600 group-hover:text-emerald-700 transition-colors" />
              <span className="text-xs font-medium text-stone-700 group-hover:text-emerald-900">
                Update Availability
              </span>
            </button>

            <button
              type="button"
              onClick={() => setReportsModalOpen(true)}
              className="p-3 rounded-2xl bg-stone-50/80 hover:bg-emerald-50/80 border border-stone-200/60 hover:border-emerald-200 transition-all flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-stone-600 group-hover:text-emerald-700 transition-colors" />
              <span className="text-xs font-medium text-stone-700 group-hover:text-emerald-900">
                View Reports
              </span>
            </button>

            <button
              type="button"
              onClick={() => setEventModalOpen(true)}
              className="p-3 rounded-2xl bg-stone-50/80 hover:bg-emerald-50/80 border border-stone-200/60 hover:border-emerald-200 transition-all flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-stone-600 group-hover:text-emerald-700 transition-colors" />
              <span className="text-xs font-medium text-stone-700 group-hover:text-emerald-900">
                Manage Schedule
              </span>
            </button>
          </div>
        </div>

        {/* Encouragement Banner: "Keep up the great work, Sai!" (2 cols) */}
        <div className="lg:col-span-2 relative bg-gradient-to-r from-[#F5EFE6] via-[#FAF7F2] to-[#EBE6DD] rounded-3xl p-6 sm:p-7 border border-stone-200/60 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-5 overflow-hidden">
          {/* Left Leaves graphic */}
          <div className="flex items-center gap-4">
            <span className="text-4xl">🌿</span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-charcoal flex items-center gap-2">
                <span>Keep up the great work, {userName}!</span>
                <span className="text-emerald-600">💚</span>
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 font-medium mt-0.5">
                Small steps make big progress.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setReportsModalOpen(true)}
            className="px-4 py-2 bg-[#0D3829] hover:bg-[#154E3A] text-white text-xs font-semibold rounded-full shadow-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <span>View Performance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── MODAL 1: Request Leave ──────────────────────────────────── */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setLeaveModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-charcoal text-base">Request Leave</h3>
                <p className="text-xs text-stone-500">
                  Current balance: <span className="font-bold text-emerald-700">{data.leaveBalance} days</span>
                </p>
              </div>
            </div>

            {leaveSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{leaveSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleRequestLeave} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  >
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Sick Leave">Sick / Medical Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Remote Work Offsite">Remote Work Offsite</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={data.leaveBalance}
                    value={leaveDays}
                    onChange={(e) => setLeaveDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Reason / Notes</label>
                  <textarea
                    rows="3"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Brief description for manager approval..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setLeaveModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0D3829] text-white hover:bg-[#154E3A] font-semibold shadow-xs"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 2: Update Availability ───────────────────────────── */}
      {availabilityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setAvailabilityModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-charcoal text-base mb-1">Update Status</h3>
            <p className="text-xs text-stone-500 mb-4">Set your current availability for teammates.</p>

            <div className="space-y-2 text-xs">
              {['On Time', 'In Meeting', 'Focus Mode', 'Away', 'Working Remotely'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setData((prev) => ({ ...prev, status: st }));
                    setAvailabilityModalOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left font-medium flex items-center justify-between transition-all ${
                    data.status === st
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                      : 'hover:bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                >
                  <span>{st}</span>
                  {data.status === st && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Add Calendar Event ────────────────────────────── */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setEventModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-charcoal text-base">Schedule New Event</h3>
                <p className="text-xs text-stone-500">Add an interactive meeting or task to your calendar.</p>
              </div>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Event Title</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Architecture Review"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Day</label>
                  <select
                    value={newEventDay}
                    onChange={(e) => setNewEventDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 font-medium"
                  >
                    {DAYS.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.name} ({d.date})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    placeholder="e.g. 10:00 - 11:00 AM"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 font-medium"
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Task">Task</option>
                    <option value="Review">Review</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Color Theme</label>
                  <select
                    value={newEventColor}
                    onChange={(e) => setNewEventColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 font-medium"
                  >
                    <option value="green">Mint Green</option>
                    <option value="purple">Lavender Purple</option>
                    <option value="peach">Warm Peach</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0D3829] text-white hover:bg-[#154E3A] font-semibold shadow-xs"
                >
                  Add to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Event Details & Deletion ───────────────────────── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {selectedEvent.type}
              </span>
              <span className="text-xs text-stone-400 font-mono">{selectedEvent.day}</span>
            </div>

            <h3 className="font-bold text-charcoal text-lg">{selectedEvent.title}</h3>
            <p className="text-xs text-stone-500 font-mono mt-1">{selectedEvent.time}</p>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-stone-100 text-xs">
              <button
                type="button"
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="text-red-600 hover:text-red-800 font-semibold cursor-pointer"
              >
                Delete Event
              </button>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: Productivity Reports ──────────────────────────── */}
      {reportsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setReportsModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-charcoal text-base">Weekly Performance Report</h3>
                <p className="text-xs text-stone-500">Consolidated analytics and productivity index.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-2xl flex items-center justify-between">
                <span className="text-stone-600">Total Work Hours</span>
                <span className="font-bold text-charcoal text-sm">{data.workHours}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl flex items-center justify-between">
                <span className="text-stone-600">Tasks Completed</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {data.todos.filter((t) => t.completed).length} / {data.todos.length} (
                  {Math.round(
                    (data.todos.filter((t) => t.completed).length / Math.max(1, data.todos.length)) * 100
                  )}
                  %)
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl flex items-center justify-between">
                <span className="text-stone-600">On-Time Attendance</span>
                <span className="font-bold text-emerald-700 text-sm">100%</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setReportsModalOpen(false)}
                className="px-4 py-2 bg-[#0D3829] text-white hover:bg-[#154E3A] rounded-xl text-xs font-semibold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
