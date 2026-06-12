import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import RouteTemplates from '@/components/apps/salvage/RouteTemplates';
import PayoutEstimate from '@/components/apps/salvage/PayoutEstimate';

const LANES = [
  { id: 'collected', label: 'COLLECTED', color: 'hsl(45, 80%, 55%)' },
  { id: 'processed', label: 'PROCESSED', color: 'hsl(210, 45%, 55%)' },
  { id: 'sold', label: 'SOLD', color: 'hsl(140, 45%, 50%)' },
];

const fieldStyle = { borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 6%)' };

export default function HaulBoard() {
  const queryClient = useQueryClient();
  const emptyForm = { lot_name: '', commodity_code: 'RMC', quantity_scu: '', origin: '', destination: '', est_value_auec: '' };
  const [form, setForm] = useState(emptyForm);

  const { data: lots = [], isLoading } = useQuery({
    queryKey: ['cargo_lots'],
    queryFn: () => base44.entities.cargo_lot.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.entities.cargo_lot.create({
        lot_name: form.lot_name,
        commodity_code: form.commodity_code,
        quantity_scu: parseFloat(form.quantity_scu) || 0,
        origin: form.origin,
        destination: form.destination,
        est_value_auec: parseFloat(form.est_value_auec) || 0,
        status: 'collected',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargo_lots'] });
      setForm(emptyForm);
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.cargo_lot.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cargo_lots'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.cargo_lot.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cargo_lots'] }),
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    if (newStatus !== result.source.droppableId) {
      moveMutation.mutate({ id: result.draggableId, status: newStatus });
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Quick add */}
      <div className="border p-3 space-y-2" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 7%)' }}>
        <p className="text-[9px] font-mono tracking-[0.2em] text-muted-foreground">NEW CARGO LOT</p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <Input placeholder="Lot name" value={form.lot_name} onChange={(e) => setForm({ ...form, lot_name: e.target.value })} className="h-8 text-xs font-mono col-span-2 md:col-span-1" style={fieldStyle} />
          <Input placeholder="Code (RMC)" value={form.commodity_code} onChange={(e) => setForm({ ...form, commodity_code: e.target.value.toUpperCase() })} className="h-8 text-xs font-mono" style={fieldStyle} />
          <Input type="number" placeholder="SCU" value={form.quantity_scu} onChange={(e) => setForm({ ...form, quantity_scu: e.target.value })} className="h-8 text-xs font-mono" style={fieldStyle} />
          <Input placeholder="Origin" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} className="h-8 text-xs font-mono" style={fieldStyle} />
          <Input placeholder="Destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="h-8 text-xs font-mono" style={fieldStyle} />
          <Input type="number" placeholder="Est. payout" value={form.est_value_auec} onChange={(e) => setForm({ ...form, est_value_auec: e.target.value })} className="h-8 text-xs font-mono" style={fieldStyle} />
        </div>
        <PayoutEstimate
          commodityCode={form.commodity_code}
          quantityScu={form.quantity_scu}
          onApply={(value) => setForm({ ...form, est_value_auec: String(value) })}
        />
        <Button
          size="sm"
          className="h-7 text-[10px] font-mono gap-1"
          disabled={!form.lot_name || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          ADD LOT
        </Button>
      </div>

      <RouteTemplates
        form={form}
        onLoad={(t) =>
          setForm({
            ...form,
            lot_name: form.lot_name || t.template_name,
            commodity_code: t.commodity_code || form.commodity_code,
            origin: t.origin || '',
            destination: t.destination || '',
            est_value_auec: t.expected_payout_auec ? String(t.expected_payout_auec) : '',
          })
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {LANES.map((lane) => {
              const laneLots = lots.filter((l) => l.status === lane.id);
              const laneScu = laneLots.reduce((s, l) => s + (l.quantity_scu || 0), 0);
              return (
                <Droppable key={lane.id} droppableId={lane.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="border flex flex-col min-h-[200px]"
                      style={{
                        borderColor: snapshot.isDraggingOver ? lane.color : 'hsl(33, 18%, 18%)',
                        background: 'hsl(30, 10%, 6%)',
                      }}
                    >
                      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
                        <span className="text-[10px] font-mono tracking-[0.2em]" style={{ color: lane.color }}>{lane.label}</span>
                        <span className="text-[9px] font-mono text-muted-foreground">{laneLots.length} lots • {laneScu.toLocaleString()} SCU</span>
                      </div>
                      <div className="flex-1 p-2 space-y-2">
                        {laneLots.map((lot, index) => (
                          <Draggable key={lot.id} draggableId={lot.id} index={index}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                className="border p-2 space-y-1"
                                style={{
                                  borderColor: snap.isDragging ? lane.color : 'hsl(33, 18%, 18%)',
                                  background: 'hsl(30, 10%, 9%)',
                                  ...prov.draggableProps.style,
                                }}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs font-mono text-foreground truncate">{lot.lot_name}</p>
                                  <button onClick={() => deleteMutation.mutate(lot.id)} className="hover:opacity-70 text-muted-foreground shrink-0">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="text-[10px] font-mono text-primary">
                                  {lot.commodity_code} • {(lot.quantity_scu || 0).toLocaleString()} SCU
                                </p>
                                {(lot.origin || lot.destination) && (
                                  <p className="text-[9px] font-mono text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate">{lot.origin || '?'}</span>
                                    <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate">{lot.destination || '?'}</span>
                                  </p>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {laneLots.length === 0 && (
                          <p className="text-center py-6 text-[10px] font-mono text-muted-foreground">Drop lots here</p>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}