import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import apiClient, { annualSurveysAPI, villagesAPI } from '../../services/api';

const FREQ_OPTIONS = ['DAILY',
  'ALTERNATE_DAYS',
  'TWICE_A_WEEK',
  'WEEKLY',
  'FORTNIGHTLY',
  'NONE'];
const FUND_HEAD_OPTIONS = ['FFC', 'SFC', 'CSR', 'OWN_INCOME', 'OTHER'];



const emptyWorkOrder = () => ({ work_order_no: '', work_order_date: '', work_order_amount: '' });
const emptyFundSanctioned = () => ({ amount: '', head: 'FFC' });
const emptyDoorToDoor = () => ({ num_households: '', num_shops: '', collection_frequency: 'DAILY' });
const emptyRoadSweeping = () => ({ width: '', length: '', cleaning_frequency: 'DAILY' });
const emptyDrainCleaning = () => ({ length: '', cleaning_frequency: 'DAILY' });
const emptyCscDetails = () => ({ numbers: '', cleaning_frequency: 'DAILY' });
const emptySwmAssets = () => ({ rrc: '', pwmu: '', compost_pit: '', collection_vehicle: '' });
const emptySbmgTargets = () => ({
  ihhl: '', csc: '', rrc: '', pwmu: '', soak_pit: '', magic_pit: '', leach_pit: '', wsp: '', dewats: ''
});
const emptyVillage = () => ({
  village_id: 0,
  village_name: '',
  population: '',
  num_households: '',
  sbmg_assets: { ihhl: '', csc: '' },
  gwm_assets: { soak_pit: '', magic_pit: '', leach_pit: '', wsp: '', dewats: '' }
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
      agency_id: o(data.agency_id || ''),
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
    agency_id: data.agency_id ?? '',
    sarpanch_name: s(data.sarpanch_name),
    vdo_name: s(data.vdo_name),
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
    vdo_name: s(form.vdo_name),
    agency_id: form.agency_id ? Number(form.agency_id) : null,  // ✅ ADD THIS
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
      required
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

const EditGPMasterModal = ({ isOpen, onClose, surveyId, gpName = 'GP', onSuccess, vdoGPId, fy_id }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errorInagency, setErrorInagency] = useState(null);
  const [form, setForm] = useState(null);
  const [agencyesData, setAgencyesData] = useState([])
  const [moduleAgency, SetModuleAgency] = useState(false)
  const [agencyForm, setAgencyForm] = useState({
    name: "",
    email: "",
    contact_number: "", address: ""
  });

  const [agencySearch, setAgencySearch] = useState("");
  const [agencyDropdownOpen, setAgencyDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const res = await apiClient.get('contractors/agencies?limit=1000');
        setAgencyesData(res.data.results || res.data);
      } catch (error) {
        console.log("Agencies Error:", error);
      }
    };

    if (isOpen) {
      fetchAgencies();
    }
  }, [isOpen]);

  const isEdit = !!surveyId;
  console.log('id->', fy_id)



  const loadSurvey = useCallback(async () => {
    if (!surveyId || !isOpen) return;
    try {
      setLoading(true);
      setError(null);
      const res = await annualSurveysAPI.getSurvey(surveyId);
      setForm(mapGetToForm(res.data));
      // view gps dataaa
      console.log(res.data)
    } catch (e) {
      console.error('Failed to load survey:', e);
      setError(e.response?.data?.detail || e.message || 'Failed to load survey.');
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [surveyId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (surveyId) {
      loadSurvey();   // Edit mode
    } else {
      // ✅ Create mode
      setForm({
        agency_id: '',
        vdo_name: '',
        sarpanch_name: '',
        sarpanch_contact: '',
        num_ward_panchs: '',
        work_order: emptyWorkOrder(),
        fund_sanctioned: emptyFundSanctioned(),
        door_to_door_collection: emptyDoorToDoor(),
        road_sweeping: emptyRoadSweeping(),
        drain_cleaning: emptyDrainCleaning(),
        csc_details: emptyCscDetails(),
        swm_assets: emptySwmAssets(),
        sbmg_targets: emptySbmgTargets(),
        village_data: [emptyVillage()]
      });

      setError(null);
    }
  }, [isOpen, surveyId, loadSurvey]);
  useEffect(() => {
    if (!isOpen) {
      SetModuleAgency(false);   // 🔥 Reset agency modal
    }
  }, [isOpen]);

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
          v.sbmg_assets = v.sbmg_assets || {};
          v.sbmg_assets[b] = value;   // ❌ no parse
        }

        if (a === 'gwm_assets') {
          v.gwm_assets = v.gwm_assets || {};
          v.gwm_assets[b] = value;   // ❌ no parse
        }

      } else {
        v[field] = value;   // ❌ no parse
      }

      return next;
    });
  }, []);

  const handlePhoneChange = (value) => {
    const cleaned = value.replace(/[^0-9]/g, "").slice(0, 10);
    update('sarpanch_contact', cleaned);
  };

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

  // Check and store when existing villgages have
  const [existingVillages, setExistingVillages] = useState([]);

  useEffect(() => {
    const loadVillages = async () => {
      try {
        const res = await villagesAPI.getVillages(vdoGPId);
        setExistingVillages(res.data || []);
      } catch (err) {
        console.log("Failed to load villages", err);
      }
    };

    if (isOpen && vdoGPId) {
      loadVillages();
    }
  }, [isOpen, vdoGPId]);

  const handleCreateAgency = async () => {
    try {
      // Basic Validation
      if (!agencyForm.name.trim()) {
        setErrorInagency("Agency name is required");
        return;
      }

      if (!agencyForm.email.trim()) {
        setErrorInagency("Email is required");
        return;
      } else if (agencyForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agencyForm.email)) {
        setErrorInagency("Invalid email format");
        return;
      }

      if (!agencyForm.contact_number.trim()) {
        setErrorInagency("Contact Number is required");
        return;
      } else if (agencyForm.contact_number && !/^\d{10}$/.test(agencyForm.contact_number)) {
        setErrorInagency("Contact number must be 10 digits");
        return;
      }

      const res = await apiClient.post("contractors/agencies", {
        name: agencyForm.name.trim(),
        email: agencyForm.email.trim(),
        phone: agencyForm.contact_number.trim(),
        address: agencyForm.address?.trim() || ""
      });

      const fresh = await apiClient.get("contractors/agencies");
      setAgencyesData(fresh.data.results || fresh.data);

      update("agency_id", res.data.id);

      setAgencySearch(res.data.name); // 🔥 immediately show selected

      SetModuleAgency(false);

      setAgencyForm({
        name: "",
        email: "",
        contact_number: "",
        address: ""
      });
      setErrorInagency(null)
      alert("Agency created successfully ✅");

    } catch (err) {
      alert(err.response?.data?.message || "Failed to create agency");
    }
  };

  useEffect(() => {
    if (!agencyDropdownOpen) return;

    const delay = setTimeout(async () => {
      try {
        const res = await apiClient.get(
          `contractors/agencies?name_like=${agencySearch}`
        );

        setAgencyesData(res.data.results || res.data);
      } catch (err) {
        console.log("Agency search error", err);
      }
    }, 400); // debounce 400ms

    return () => clearTimeout(delay);
  }, [agencySearch, agencyDropdownOpen]);

  useEffect(() => {
    const close = () => setAgencyDropdownOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);


  const handleSubmit = useCallback(async () => {
    if (!form || saving) return;

    try {
      setSaving(true);
      setError(null);

      if (!form.sarpanch_contact || form.sarpanch_contact.length !== 10) {
        setError("Phone number must be exactly 10 digits ❌");
        setSaving(false);
        return;
      }

      // 🔥 1️⃣ Deep clone (state mutate nahi karna)
      const updatedForm = JSON.parse(JSON.stringify(form));

      // 🔥 2️⃣ Pehle naye villages create karo
      for (let i = 0; i < updatedForm.village_data.length; i++) {
        const v = updatedForm.village_data[i];

        if (!v.village_id || v.village_id === 0) {

          if (!v.village_name.trim()) {
            throw new Error("Village name required.");
          }

          try {
            const res = await villagesAPI.createVillage({
              name: v.village_name.trim(),
              gp_id: Number(vdoGPId),
              description: v.village_name.trim()
            });

            updatedForm.village_data[i].village_id = res.data.id;

          } catch (err) {

            // Agar duplicate aaye toh existing ID le lo
            if (err.response?.data?.message?.includes("unique")) {

              const fresh = await villagesAPI.getVillages(vdoGPId);

              const existing = fresh.data.find(ev =>
                ev.name.toLowerCase() === v.village_name.trim().toLowerCase()
              );

              if (existing) {
                updatedForm.village_data[i].village_id = existing.id;
              } else {
                throw err;
              }

            } else {
              throw err;
            }
          }
        }
      }

      // 🔥 3️⃣ Ab final payload banao
      const payload = formToPayload(updatedForm);

      console.log("FINAL PAYLOAD:", JSON.stringify(payload, null, 2));
      if (isEdit) {
        // 🔥 4️⃣ Survey update
        await annualSurveysAPI.updateSurvey(surveyId, payload);
      } else {
        const basePayload = formToPayload(updatedForm);

        const finalPayload = {
          ...basePayload,
          fy_id: Number(fy_id),   // ✅ ADD THIS
          gp_id: Number(vdoGPId),
          survey_date: new Date().toISOString().split('T')[0], // ✅ ADD THIS
          agency_id: Number(updatedForm.agency_id) || null
        };

        console.log("FINAL PAYLOAD:", JSON.stringify(finalPayload, null, 2));

        await annualSurveysAPI.addsurvey(finalPayload);
      }

      alert("Survey & villages saved successfully ✅");

      onSuccess?.();
      onClose?.();

    } catch (e) {
      console.log("FULL ERROR:", e.response?.data);

      const data = e.response?.data;

      if (data?.detail) {
        if (Array.isArray(data.detail)) {
          alert(data.detail.map(d => d.msg).join(", "));
        } else {
          alert(data.detail);
        }
      }
      else if (data?.message) {
        // 🔥 Duplicate village error
        alert(data.message);
      }
      else {
        alert(e.message || "Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  }, [form, saving, surveyId, onSuccess, onClose, vdoGPId]);

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
            {isEdit ? "Edit GP Master Data" : "Add GP Master Data"} {gpName ? `— ${gpName}` : ''}
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
              {section('VDO Details', grid2(
                <>
                  <Input label="VDO name" value={form.vdo_name} onChange={(v) => update('vdo_name', v)} disabled={saving} />
                </>
              ))}
              {section('Basic information', grid2(
                <>
                  <Input label="Sarpanch name" value={form.sarpanch_name} onChange={(v) => update('sarpanch_name', v)} disabled={saving} />
                  <Input label="Sarpanch contact" value={form.sarpanch_contact} onChange={handlePhoneChange} disabled={saving} />
                  <Input label="Number of ward panchs" type="number" min={0} value={form.num_ward_panchs} onChange={(v) => update('num_ward_panchs', v === '' ? '' : Number(v))} disabled={saving} />
                </>
              ))}
              {section('Agency', grid2(
                <>
                  {/* Agency Filed */}
                  <div className=''>
                    <div className='text-end'>
                      <button
                        onClick={() => SetModuleAgency(true)}
                        style={{ color: '#10b981', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                        className='uppercase'>+ ADD Agency</button>
                    </div>
                    <div style={{ position: "relative", width: "100%" }}>

                      {/* Search Input */}
                      <input
                        type="text"
                        placeholder="Search Agency..."
                        value={agencySearch}
                        onChange={(e) => {
                          setAgencySearch(e.target.value);
                          setAgencyDropdownOpen(true);
                        }}
                        onFocus={() => setAgencyDropdownOpen(true)}
                        style={{
                          padding: "8px 10px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "14px",
                          width: "100%"
                        }}
                      />

                      {/* Dropdown */}
                      {agencyDropdownOpen && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            background: "#fff",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            zIndex: 1000
                          }}
                        >
                          {agencyesData.length === 0 && (
                            <div style={{ padding: "8px", fontSize: "13px" }}>
                              No agency found
                            </div>
                          )}

                          {agencyesData.map((agency) => (
                            <div
                              key={agency.id}
                              onClick={() => {
                                update("agency_id", agency.id);
                                setAgencySearch(agency.name);  // 👈 yaha name set karo
                                setAgencyDropdownOpen(false);
                              }}
                              style={{
                                padding: "8px",
                                cursor: "pointer",
                                fontSize: "14px"
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#f3f4f6")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "#fff")
                              }
                            >
                              {agency.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>


                  </div>

                </>
              ))}
              {section('Work order', grid3(
                <>
                  <Input label="Work order no" value={form.work_order?.work_order_no} onChange={(v) => update('work_order.work_order_no', v)} disabled={saving} />
                  <Input label="Work order date" type="date" value={form.work_order?.work_order_date} onChange={(v) => update('work_order.work_order_date', v)} disabled={saving} />
                  <Input label="Work order amount" type="number" min={0} value={form.work_order?.work_order_amount} onChange={(v) => update('work_order.work_order_amount', v === '' ? '' : Number(v))} disabled={saving} />
                </>
              ))}
              {section('Fund sanctioned', grid2(
                <>
                  <Input label="Amount" type="number" min={0} value={form.fund_sanctioned?.amount} onChange={(v) => update('fund_sanctioned.amount',v === '' ? '' : Number(v))} disabled={saving} />
                  <Select label="Head" value={form.fund_sanctioned?.head} onChange={(v) => update('fund_sanctioned.head', v)} options={FUND_HEAD_OPTIONS} disabled={saving} />
                </>
              ))}
              {section('Door to door collection', (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {grid3(
                    <>
                      <Input label="Number of households" type="number" min={0} value={form.door_to_door_collection?.num_households} onChange={(v) => update('door_to_door_collection.num_households',v === '' ? '' : Number(v))} disabled={saving} />
                      <Input label="Number of shops" type="number" min={0} value={form.door_to_door_collection?.num_shops} onChange={(v) => update('door_to_door_collection.num_shops', v === '' ? '' : Number(v))} disabled={saving} />
                      <Select label="Collection frequency" value={form.door_to_door_collection?.collection_frequency} onChange={(v) => update('door_to_door_collection.collection_frequency', v)} options={FREQ_OPTIONS} disabled={saving} />
                    </>
                  )}
                </div>
              ))}
              {section('Road sweeping', grid3(
                <>
                  <Input label="Width (m)" type="number" min={0} value={form.road_sweeping?.width} onChange={(v) => update('road_sweeping.width', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Length (m)" type="number" min={0} value={form.road_sweeping?.length} onChange={(v) => update('road_sweeping.length', v === '' ? '' : Number(v))} disabled={saving} />
                  <Select label="Cleaning frequency" value={form.road_sweeping?.cleaning_frequency} onChange={(v) => update('road_sweeping.cleaning_frequency', v)} options={FREQ_OPTIONS} disabled={saving} />
                </>
              ))}
              {section('Drain cleaning', grid2(
                <>
                  <Input label="Length (m)" type="number" min={0} value={form.drain_cleaning?.length} onChange={(v) => update('drain_cleaning.length', v === '' ? '' : Number(v))} disabled={saving} />
                  <Select label="Cleaning frequency" value={form.drain_cleaning?.cleaning_frequency} onChange={(v) => update('drain_cleaning.cleaning_frequency', v)} options={FREQ_OPTIONS} disabled={saving} />
                </>
              ))}
              {section('CSC details', grid2(
                <>
                  <Input label="Numbers" type="number" min={0} value={form.csc_details?.numbers} onChange={(v) => update('csc_details.numbers',v === '' ? '' : Number(v))} disabled={saving} />
                  <Select label="Cleaning frequency" value={form.csc_details?.cleaning_frequency} onChange={(v) => update('csc_details.cleaning_frequency', v)} options={FREQ_OPTIONS} disabled={saving} />
                </>
              ))}
              {section('SWM assets', grid3(
                <>
                  <Input label="RRC" type="number" min={0} value={form.swm_assets?.rrc} onChange={(v) => update('swm_assets.rrc', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label='PWMU' type="number" min={0} value={form.swm_assets?.pwmu} onChange={(v) => update('swm_assets.pwmu', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Compost pit" type="number" min={0} value={form.swm_assets?.compost_pit} onChange={(v) => update('swm_assets.compost_pit', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Collection vehicle" type="number" min={0} value={form.swm_assets?.collection_vehicle} onChange={(v) => update('swm_assets.collection_vehicle', v === '' ? '' : Number(v))} disabled={saving} />
                </>
              ))}
              {section('SBMG targets', (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {['ihhl', 'csc', 'rrc', 'pwmu', 'soak_pit', 'magic_pit', 'leach_pit', 'wsp', 'dewats'].map((k) => (
                    <Input key={k} label={k.replace(/_/g, ' ')} type="number" min={0} value={form.sbmg_targets?.[k]} onChange={(v) => update(`sbmg_targets.${k}`,v === '' ? '' : Number(v))} disabled={saving} />
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
                        <Input label="Population" type="number" min={0} value={v.population ?? ''} onChange={(val) => updateVillage(i, 'population', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="Number of households" type="number" min={0} value={v.num_households ?? ''} onChange={(val) => updateVillage(i, 'num_households', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="SBMG IHHL" type="number" min={0} value={v.sbmg_assets?.ihhl ?? ''} onChange={(val) => updateVillage(i, 'sbmg_assets.ihhl', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="SBMG CSC" type="number" min={0} value={v.sbmg_assets?.csc ?? ''} onChange={(val) => updateVillage(i, 'sbmg_assets.csc', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="Soak pit" type="number" min={0} value={v.gwm_assets?.soak_pit ?? ''} onChange={(val) => updateVillage(i, 'gwm_assets.soak_pit', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="Magic pit" type="number" min={0} value={v.gwm_assets?.magic_pit ?? ''} onChange={(val) => updateVillage(i, 'gwm_assets.magic_pit', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="Leach pit" type="number" min={0} value={v.gwm_assets?.leach_pit ?? ''} onChange={(val) => updateVillage(i, 'gwm_assets.leach_pit', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="WSP" type="number" min={0} value={v.gwm_assets?.wsp ?? ''} onChange={(val) => updateVillage(i, 'gwm_assets.wsp', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="DEWATS" type="number" min={0} value={v.gwm_assets?.dewats ?? ''} onChange={(val) => updateVillage(i, 'gwm_assets.dewats', val === '' ? '' : Number(val))} disabled={saving} />
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


      {/* Agency create module */}
      {moduleAgency && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{

            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}  // 🔥 ALSO HERE
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "12px",
              width: "400px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
            }}
          >
            <h3 style={{ marginBottom: "15px" }}>Create Agency</h3>

            {errorInagency && !loading && (
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', marginBottom: '16px' }}>
                {errorInagency}
              </div>
            )}

            <Input
              label="Agency Name"
              value={agencyForm.name}
              onChange={(v) =>
                setAgencyForm((prev) => ({ ...prev, name: v }))
              }
            />

            <Input
              label="Email"
              value={agencyForm.email}
              onChange={(v) =>
                setAgencyForm((prev) => ({ ...prev, email: v }))
              }
            />

            <Input
              label="Contact Number"
              value={agencyForm.contact_number}
              onChange={(v) =>
                setAgencyForm((prev) => ({
                  ...prev,
                  contact_number: v.replace(/[^0-9]/g, "").slice(0, 10)
                }))
              }
            />
            <Input
              label="Address"
              value={agencyForm.address}
              onChange={(v) =>
                setAgencyForm((prev) => ({ ...prev, address: v }))
              }
            />

            <div style={{ marginTop: "15px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => SetModuleAgency(false)}
                style={{
                  padding: "8px 14px",
                  background: "#e5e7eb",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleCreateAgency}
                style={{
                  padding: "8px 14px",
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default EditGPMasterModal;
