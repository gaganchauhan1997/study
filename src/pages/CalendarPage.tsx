import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Clock, BookOpen, GraduationCap, AlertCircle, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay } from "date-fns";

const eventTypeColors: Record<string, string> = {
  study: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  exam: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  deadline: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  reminder: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export default function CalendarPage() {
  const utils = trpc.useUtils();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("study");
  const [reminder, setReminder] = useState(false);

  const { data: events } = trpc.calendar.list.useQuery();
  const createMutation = trpc.calendar.create.useMutation({
    onSuccess: () => { toast.success("Event added!"); utils.calendar.list.invalidate(); setShowAddForm(false); setTitle(""); setDescription(""); setEventType("study"); setReminder(false); },
  });
  const deleteMutation = trpc.calendar.delete.useMutation({ onSuccess: () => utils.calendar.list.invalidate() });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const getDays = () => { const days = []; let day = calendarStart; while (day <= calendarEnd) { days.push(day); day = addDays(day, 1); } return days; };
  const getEventsForDay = (date: Date) => events?.filter((e) => isSameDay(new Date(e.eventDate), date)) || [];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Calendar className="h-7 w-7 text-primary" />Calendar</h1>
        <p className="text-muted-foreground mt-1">Plan your study schedule and deadlines</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{format(currentDate, "MMMM yyyy")}</CardTitle>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setCurrentDate(new Date())}>Today</Button>
                <Button size="icon" variant="ghost" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((d) => <div key={d} className="text-center text-sm font-medium text-muted-foreground py-2">{d}</div>)}
              {getDays().map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const dayEvents = getEventsForDay(day);
                return (
                  <button key={idx} className={`p-2 rounded-lg text-sm min-h-[60px] text-left transition-colors ${!isCurrentMonth ? "text-muted-foreground/40" : ""} ${isToday ? "ring-2 ring-primary" : ""} ${isSelected ? "bg-primary/10" : "hover:bg-accent"}`} onClick={() => { setSelectedDate(day); setShowAddForm(false); }}>
                    <span className="font-medium">{format(day, "d")}</span>
                    {dayEvents.length > 0 && <div className="flex gap-0.5 mt-1 flex-wrap">{dayEvents.slice(0, 3).map((e, i) => <div key={i} className={`h-1.5 w-1.5 rounded-full ${e.eventType === "exam" ? "bg-red-500" : e.eventType === "deadline" ? "bg-yellow-500" : "bg-blue-500"}`} />)}</div>}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {selectedDate && (
            <Card>
              <CardHeader><CardTitle className="text-base">{format(selectedDate, "EEEE, MMM d")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {!showAddForm ? (
                  <>
                    <Button size="sm" className="w-full" onClick={() => setShowAddForm(true)}><Plus className="h-4 w-4 mr-2" />Add Event</Button>
                    <div className="space-y-2">
                      {getEventsForDay(selectedDate).map((event) => (
                        <div key={event.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted">
                          <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{event.title}</p>
                            {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
                            <Badge variant="outline" className={`text-xs mt-1 ${eventTypeColors[event.eventType] || ""}`}>{event.eventType}</Badge>
                          </div>
                          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 text-destructive" onClick={() => deleteMutation.mutate({ id: event.id })}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      ))}
                      {getEventsForDay(selectedDate).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No events</p>}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div><Label className="text-xs">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title..." /></div>
                    <div><Label className="text-xs">Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
                    <div><Label className="text-xs">Type</Label><div className="flex gap-1 flex-wrap">{["study", "exam", "deadline", "reminder"].map((t) => <Button key={t} size="sm" variant={eventType === t ? "default" : "outline"} onClick={() => setEventType(t)}>{t}</Button>)}</div></div>
                    <div className="flex items-center gap-2"><Switch checked={reminder} onCheckedChange={setReminder} /><Label className="text-xs">Reminder</Label></div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { if (!title.trim() || !selectedDate) return; const date = new Date(selectedDate); date.setHours(12, 0, 0, 0); createMutation.mutate({ title: title.trim(), description: description.trim() || null, eventDate: date.toISOString(), eventType, reminder }); }} disabled={createMutation.isPending || !title.trim()}>
                        {createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}Add
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">Event Types</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(eventTypeColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2"><div className={`h-2.5 w-2.5 rounded-full ${color.split(" ")[0]}`} /><span className="text-sm capitalize">{type}</span></div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
