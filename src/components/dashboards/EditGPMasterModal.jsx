import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { annualSurveysAPI } from '../../services/api';

const FREQ_OPTIONS = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'];
const FUND_HEAD_OPTIONS = ['FFC', 'SBMG', 'Other'];

const emptyWorkOrder = () => ({ work_order_no: '', work_order_date: '', work_order_amount: 0 });
const emptyFundSanctioned = () => ({ amount: 0, head: 'FFC' });
const emptyDoorToDoor = () => ({ num_households: 0, num_shops: 0, collection_frequency: 'DAILY' });
const emptyRoadSweeping = () => ({ width: 0, length: 0, cleaning_frequency: 'DAILY' });
const emptyDrainCleaning = () => ({ length: 0, cleaning_frequency: 'DAILY' });
const emptyCscDetails = () => ({ numbers: 0, cleaning_frequency: 'DAILY' });
const emptySwmAssets = () => ({ rrc: 0, pwmu: 0, compost_pit: 0, collection_vehicle: 0 });
const emptySbmgTargets = () => ({
  ihhl: 0, csc: 0, rrc: 0, pwmu: 0, soak_pit: 0, magic_pit: 0, leach_pit: 0, wsp: 0, dewats: 0
});
const emptyVillage = () => ({
  village_id: 0,
  village_name: '',
  population: 0,
  num_households: 0,
  sbmg_assets: { ihhl: 0, csc: 0 },
  gwm_assets: { soak_pit: 0, magic_pit: 0, leach_pit: 0, wsp: 0, dewats: 0 }
});

function mapGetToForm(data) {
  const o = (x, d) => (x != null && typeof x === 'object' ? x : d);
  const n = (x, d = 0) => (typeof x === 'number' && !isNaN(x) ? x : (parseFloat(x) || d));
  const s = (x, d = '') => (x != null && String(x).trim() !== '' ? String(x).trim() : d);

  const wo = o(data.work_order, {});
  const fs = o(data.fund_sanctioned, {});
  const d2d = o(data.door_to_door_collection, {});
  const rs = o(data.road_sweeping, {});
  const dc = o(data.drain_cleaning, {});
  const csc = o(data.csc_details, {});
  const swm = o(data.swm_assets, {});
  const sbmg = o(data.sbmg_targets, {});

  const vlist = Array.isArray(data.village_data) ? data.village_data : [];
  const village_data = vlist.length > 0
    ? vlist.map((v) => ({
        village_id: n(v.village_id),
        village_name: s(v.village_name),
        population: n(v.population),
        num_households: n(v.num_households),
        sbmg_assets: {
          ihhl: n(o(v.sbmg_assets, {}).ihhl),
          csc: n(o(v.sbmg_assets, {}).csc)
        },
        gwm_assets: {
          soak_pit: n(o(v.gwm_assets, {}).soak_pit),
          magic_pit: n(o(v.gwm_assets, {}).magic_pit),
          leach_pit: n(o(v.gwm_assets, {}).leach_pit),
          wsp: n(o(v.gwm_assets, {}).wsp),
          dewats: n(o(v.gwm_assets, {}).dewats)
        }
      }))
    : [emptyVillage()];

  return {
    sarpanch_name: s(data.sarpanch_name),
    sarpanch_contact: s(data.sarpanch_contact),
    num_ward_panchs: n(data.num_ward_panchs),
    work_order: {
      work_order_no: s(wo.work_order_no),
      work_order_date: s(wo.work_order_date) || new Date().toISOString().split('T')[0],
      work_order_amount: n(wo.work_order_amount)
    },
    fund_sanctioned: {
      amount: n(fs.amount),
      head: s(fs.head, 'FFC')
    },
    door_to_door_collection: {
      num_households: n(d2d.num_households),
      num_shops: n(d2d.num_shops),
      collection_frequency: FREQ_OPTIONS.includes(d2d.collection_frequency) ? d2d.collection_frequency : 'DAILY'
    },
    road_sweeping: {
      width: n(rs.width),
      length: n(rs.length),
      cleaning_frequency: FREQ_OPTIONS.includes(rs.cleaning_frequency) ? rs.cleaning_frequency : 'DAILY'
    },
    drain_cleaning: {
      length: n(dc.length),
      cleaning_frequency: FREQ_OPTIONS.includes(dc.cleaning_frequency) ? dc.cleaning_frequency : 'DAILY'
    },
    csc_details: {
      numbers: n(csc.numbers),
      cleaning_frequency: FREQ_OPTIONS.includes(csc.cleaning_frequency) ? csc.cleaning_frequency : 'DAILY'
    },
    swm_assets: {
      rrc: n(swm.rrc),
      pwmu: n(swm.pwmu),
      compost_pit: n(swm.compost_pit),
      collection_vehicle: n(swm.collection_vehicle)
    },
    sbmg_targets: {
      ihhl: n(sbmg.ihhl),
      csc: n(sbmg.csc),
      rrc: n(sbmg.rrc),
      pwmu: n(sbmg.pwmu),
      soak_pit: n(sbmg.soak_pit),
      magic_pit: n(sbmg.magic_pit),
      leach_pit: n(sbmg.leach_pit),
      wsp: n(sbmg.wsp),
      dewats: n(sbmg.dewats)
    },
    village_data
  };
}

function formToPayload(form) {
  const n = (x) => (typeof x === 'number' && !isNaN(x) ? x : (parseFloat(x) || 0));
  const s = (x) => (x != null ? String(x) : '');

  return {
    sarpanch_name: s(form.sarpanch_name),
    sarpanch_contact: s(form.sarpanch_contact),
    num_ward_panchs: n(form.num_ward_panchs),
    work_order: {
      work_order_no: s(form.work_order.work_order_no),
      work_order_date: s(form.work_order.work_order_date) || new Date().toISOString().split('T')[0],
      work_order_amount: n(form.work_order.work_order_amount)
    },
    fund_sanctioned: {
      amount: n(form.fund_sanctioned.amount),
      head: s(form.fund_sanctioned.head) || 'FFC'
    },
    door_to_door_collection: {
      num_households: n(form.door_to_door_collection.num_households),
      num_shops: n(form.door_to_door_collection.num_shops),
      collection_frequency: form.door_to_door_collection.collection_frequency || 'DAILY'
    },
    road_sweeping: {
      width: n(form.road_sweeping.width),
      length: n(form.road_sweeping.length),
      cleaning_frequency: form.road_sweeping.cleaning_frequency || 'DAILY'
    },
    drain_cleaning: {
      length: n(form.drain_cleaning.length),
      cleaning_frequency: form.drain_cleaning.cleaning_frequency || 'DAILY'
    },
    csc_details: {
      numbers: n(form.csc_details.numbers),
      cleaning_frequency: form.csc_details.cleaning_frequency || 'DAILY'
    },
    swm_assets: {
      rrc: n(form.swm_assets.rrc),
      pwmu: n(form.swm_assets.pwmu),
      compost_pit: n(form.swm_assets.compost_pit),
      collection_vehicle: n(form.swm_assets.collection_vehicle)
    },
    sbmg_targets: {
      ihhl: n(form.sbmg_targets.ihhl),
      csc: n(form.sbmg_targets.csc),
      rrc: n(form.sbmg_targets.rrc),
      pwmu: n(form.sbmg_targets.pwmu),
      soak_pit: n(form.sbmg_targets.soak_pit),
      magic_pit: n(form.sbmg_targets.magic_pit),
      leach_pit: n(form.sbmg_targets.leach_pit),
      wsp: n(form.sbmg_targets.wsp),
      dewats: n(form.sbmg_targets.dewats)
    },
    village_data: (form.village_data || []).map((v) => ({
      village_id: n(v.village_id),
      village_name: s(v.village_name),
      population: n(v.population),
      num_households: n(v.num_households),
      sbmg_assets: { ihhl: n(v.sbmg_assets?.ihhl), csc: n(v.sbmg_assets?.csc) },
      gwm_assets: {
        soak_pit: n(v.gwm_assets?.soak_pit),
        magic_pit: n(v.gwm_assets?.magic_pit),
        leach_pit: n(v.gwm_assets?.leach_pit),
        wsp: n(v.gwm_assets?.wsp),
        dewats: n(v.gwm_assets?.dewats)
      }
    }))
  };
}

const Input = ({ label, value, onChange, type = 'text', placeholder = '', disabled, min }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{label}</label>
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      style={{
        padding: '8px 10px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none'
      }}
    />
  </div>
);

const Select = ({ label, value, onChange, options, disabled }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{label}</label>
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        padding: '8px 10px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none',
        backgroundColor: 'white'
      }}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const EditGPMasterModal = ({ isOpen, onClose, surveyId, gpName = 'GP', onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null);

  const loadSurvey = useCallback(async () => {
    if (!surveyId || !isOpen) return;
    try {
      setLoading(true);
      setError(null);
      const res = await annualSurveysAPI.getSurvey(surveyId);
      setForm(mapGetToForm(res.data));
    } catch (e) {
      console.error('Failed to load survey:', e);
      setError(e.response?.data?.detail || e.message || 'Failed to load survey.');
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [surveyId, isOpen]);

  useEffect(() => {
    if (isOpen && surveyId) {
      loadSurvey();
    } else {
      setForm(null);
      setError(null);
    }
  }, [isOpen, surveyId, loadSurvey]);

  const update = useCallback((path, value) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        const idx = parseInt(p, 10);
        if (!isNaN(idx)) {
          cur = cur[idx];
        } else {
          if (!cur[p]) cur[p] = {};
          cur = cur[p];
        }
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  }, []);

  const updateVillage = useCallback((index, field, value) => {
    setForm((prev) => {
      if (!prev || !prev.village_data) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      const v = next.village_data[index];
      if (!v) return prev;
      if (field.includes('.')) {
        const [a, b] = field.split('.');
        if (a === 'sbmg_assets') {
          v.sbmg_assets = v.sbmg_assets || { ihhl: 0, csc: 0 };
          v.sbmg_assets[b] = typeof value === 'number' ? value : (parseFloat(value) || 0);
        } else if (a === 'gwm_assets') {
          v.gwm_assets = v.gwm_assets || { soak_pit: 0, magic_pit: 0, leach_pit: 0, wsp: 0, dewats: 0 };
          v.gwm_assets[b] = typeof value === 'number' ? value : (parseFloat(value) || 0);
        }
      } else {
        if (['village_id', 'population', 'num_households'].includes(field)) {
          v[field] = typeof value === 'number' ? value : (parseFloat(value) || 0);
        } else {
          v[field] = value;
        }
      }
      return next;
    });
  }, []);

  const addVillage = useCallback(() => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      next.village_data = next.village_data || [];
      next.village_data.push(emptyVillage());
      return next;
    });
  }, []);

  const removeVillage = useCallback((index) => {
    setForm((prev) => {
      if (!prev || !prev.village_data || prev.village_data.length <= 1) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      next.village_data.splice(index, 1);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form || saving || !surveyId) return;
    try {
      setSaving(true);
      setError(null);
      const payload = formToPayload(form);
      await annualSurveysAPI.updateSurvey(surveyId, payload);
      onSuccess?.();
      onClose?.();
    } catch (e) {
      console.error('Failed to update survey:', e);
      setError(e.response?.data?.detail || e.message || 'Failed to update.');
    } finally {
      setSaving(false);
    }
  }, [form, saving, surveyId, onSuccess, onClose]);

  const handleOverlayClick = useCallback(() => {
    if (!saving) onClose?.();
  }, [saving, onClose]);

  if (!isOpen) return null;

  const section = (title, children) => (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 10px 0', paddingBottom: '4px', borderBottom: '1px solid #e5e7eb' }}>{title}</h4>
      {children}
    </div>
  );

  const grid2 = (children) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>{children}</div>
  );
  const grid3 = (children) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>{children}</div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '720px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 45px -15px rgba(15,23,42,0.35)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Edit GP Master Data {gpName ? `— ${gpName}` : ''}
          </h2>
          <button onClick={handleOverlayClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6b7280' }} disabled={saving}>
            <X size={22} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading…</div>}
          {error && !loading && (
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}
          {!loading && form && (
            <>
              {section('Basic information', grid2(
                <>
                  <Input label="Sarpanch name" value={form.sarpanch_name} onChange={(v) => update('sarpanch_name', v)} disabled={saving} />
                  <Input label="Sarpanch contact" value={form.sarpanch_contact} onChange={(v) => update('sarpanch_contact', v)} disabled={saving} />
                  <Input label="Number of ward panchs" type="number" min={0} value={form.num_ward_panchs} onChange={(v) => update('num_ward_panchs', parseInt(v, 10) || 0)} disabled={saving} />
                </>
              ))}
              {section('Work order', grid3(
                <>
                  <Input label="Work order no" value={form.work_order?.work_order_no} onChange={(v) => update('work_order.work_order_no', v)} disabled={saving} />
                  <Input label="Work order date" type="date" value={form.work_order?.work_order_date} onChange={(v) => update('work_order.work_order_date', v)} disabled={saving} />
                  <Input label="Work order amount" type="number" min={0} value={form.work_order?.work_order_amount} onChange={(v) => update('work_order.work_order_amount', parseFloat(v) || 0)} disabled={saving} />
                </>
              ))}
              {section('Fund sanctioned', grid2(
                <>
                  <Input label="Amount" type="number" min={0} value={form.fund_sanctioned?.amount} onChange={(v) => update('fund_sanctioned.amount', parseFloat(v) || 0)} disabled={saving} />
                  <Select label="Head" value={form.fund_sanctioned?.head} onChange={(v) => update('fund_sanctioned.head', v)} options={FUND_HEAD_OPTIONS} disabled={saving} />
                </>
              ))}
              {section('Door to door collection', (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {grid3(
                    <>
                      <Input label="Number of households" type="number" min={0} value={form.door_to_door_collection?.num_households} onChange={(v) => update('door_to_door_collection.num_households', parseFloat(v) || 0)} disabled={saving} />
                      <Input label="Number of shops" type="number" min={0} value={form.door_to_door_collection?.num_shops} onChange={(v) => update('door_to_door_collection.num_shops', parseFloat(v) || 0)} disabled={saving} />
                      <Select label="Collection frequency" value={form.door_to_door_collection?.collection_frequency} onChange={(v) => update('door_to_door_collection.collection_frequency', v)} options={FREQ_OPTIONS} disabled={saving} />
                    </>
                  )}
                </div>
              ))}
              {section('Road sweeping', grid3(
                <>
                  <Input label="Width (m)" type="number" min={0} value={form.road_sweeping?.width} onChange={(v) => update('road_sweeping.width', parseFloat(v) || 0)} disabled={saving} />
                  <Input label="Length (m)" type="number" min={0} value={form.road_sweeping?.length} onChange={(v) => update('road_sweeping.length', parseFloat(v) || 0)} disabled={saving} />
                  <Select label="Cleaning frequency" value={form.road_sweeping?.cleaning_frequency} onChange={(v) => update('road_sweeping.cleaning_frequency', v)} options={FREQ_OPTIONS} disabled={saving} />
                </>
              ))}
              {section('Drain cleaning', grid2(
                <>
                  <Input label="Length (m)" type="number" min={0} value={form.drain_cleaning?.length} onChange={(v) => update('drain_cleaning.length', parseFloat(v) || 0)} disabled={saving} />
                  <Select label="Cleaning frequency" value={form.drain_cleaning?.cleaning_frequency} onChange={(v) => update('drain_cleaning.cleaning_frequency', v)} options={FREQ_OPTIONS} disabled={saving} />
                </>
              ))}
              {section('CSC details', grid2(
                <>
                  <Input label="Numbers" type="number" min={0} value={form.csc_details?.numbers} onChange={(v) => update('csc_details.numbers', parseFloat(v) || 0)} disabled={saving} />
                  <Select label="Cleaning frequency" value={form.csc_details?.cleaning_frequency} onChange={(v) => update('csc_details.cleaning_frequency', v)} options={FREQ_OPTIONS} disabled={saving} />
                </>
              ))}
              {section('SWM assets', grid3(
                <>
                  <Input label="RRC" type="number" min={0} value={form.swm_assets?.rrc} onChange={(v) => update('swm_assets.rrc', parseFloat(v) || 0)} disabled={saving} />
                  <Input label="PWMU" type="number" min={0} value={form.swm_assets?.pwmu} onChange={(v) => update('swm_assets.pwmu', parseFloat(v) || 0)} disabled={saving} />
                  <Input label="Compost pit" type="number" min={0} value={form.swm_assets?.compost_pit} onChange={(v) => update('swm_assets.compost_pit', parseFloat(v) || 0)} disabled={saving} />
                  <Input label="Collection vehicle" type="number" min={0} value={form.swm_assets?.collection_vehicle} onChange={(v) => update('swm_assets.collection_vehicle', parseFloat(v) || 0)} disabled={saving} />
                </>
              ))}
              {section('SBMG targets', (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {['ihhl','csc','rrc','pwmu','soak_pit','magic_pit','leach_pit','wsp','dewats'].map((k) => (
                    <Input key={k} label={k.replace(/_/g, ' ')} type="number" min={0} value={form.sbmg_targets?.[k]} onChange={(v) => update(`sbmg_targets.${k}`, parseFloat(v) || 0)} disabled={saving} />
                  ))}
                </div>
              ))}
              {section('Village data', (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(form.village_data || []).map((v, i) => (
                    <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Village {i + 1}</span>
                        <button type="button" onClick={() => removeVillage(i)} disabled={saving || (form.village_data?.length || 0) <= 1} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#dc2626' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <Input label="Village name" value={v.village_name} onChange={(val) => updateVillage(i, 'village_name', val)} disabled={saving} />
                        <Input label="Village ID" type="number" min={0} value={v.village_id} onChange={(val) => updateVillage(i, 'village_id', parseInt(val, 10) || 0)} disabled={saving} />
                        <Input label="Population" type="number" min={0} value={v.population} onChange={(val) => updateVillage(i, 'population', parseInt(val, 10) || 0)} disabled={saving} />
                        <Input label="Number of households" type="number" min={0} value={v.num_households} onChange={(val) => updateVillage(i, 'num_households', parseInt(val, 10) || 0)} disabled={saving} />
                        <Input label="SBMG IHHL" type="number" min={0} value={v.sbmg_assets?.ihhl} onChange={(val) => updateVillage(i, 'sbmg_assets.ihhl', parseFloat(val) || 0)} disabled={saving} />
                        <Input label="SBMG CSC" type="number" min={0} value={v.sbmg_assets?.csc} onChange={(val) => updateVillage(i, 'sbmg_assets.csc', parseFloat(val) || 0)} disabled={saving} />
                        <Input label="Soak pit" type="number" min={0} value={v.gwm_assets?.soak_pit} onChange={(val) => updateVillage(i, 'gwm_assets.soak_pit', parseFloat(val) || 0)} disabled={saving} />
                        <Input label="Magic pit" type="number" min={0} value={v.gwm_assets?.magic_pit} onChange={(val) => updateVillage(i, 'gwm_assets.magic_pit', parseFloat(val) || 0)} disabled={saving} />
                        <Input label="Leach pit" type="number" min={0} value={v.gwm_assets?.leach_pit} onChange={(val) => updateVillage(i, 'gwm_assets.leach_pit', parseFloat(val) || 0)} disabled={saving} />
                        <Input label="WSP" type="number" min={0} value={v.gwm_assets?.wsp} onChange={(val) => updateVillage(i, 'gwm_assets.wsp', parseFloat(val) || 0)} disabled={saving} />
                        <Input label="DEWATS" type="number" min={0} value={v.gwm_assets?.dewats} onChange={(val) => updateVillage(i, 'gwm_assets.dewats', parseFloat(val) || 0)} disabled={saving} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addVillage} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <Plus size={16} /> Add village
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {!loading && form && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={handleOverlayClick} disabled={saving} style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditGPMasterModal;
