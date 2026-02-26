import { X } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import apiClient from '../../../services/api';


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


const EditContractorDetails = ({ isOpen, onClose, editData, onsuccess, gpId }) => {

    const [agencies, setAgencies] = useState([]);
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [moduleAgency, SetModuleAgency] = useState(false)
    const [agencySearch, setAgencySearch] = useState("");
    const [agencyDropdownOpen, setAgencyDropdownOpen] = useState(false);
    const [agencyesData, setAgencyesData] = useState([])

    const [errorInagency, setErrorInagency] = useState(null);
    const [loading, setLoading] = useState(false);

    const [agencyForm, setAgencyForm] = useState({
        name: "",
        email: "",
        contact_number: "", address: ""
    });




    const fetchAgencies = async () => {
        try {
            const res = await apiClient.get("/contractors/agencies"); // 👈 API endpoint
            setAgencies(res.data);
        } catch (error) {
            console.error("Agency fetch error:", error);
        }
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, ""); // only numbers
        if (value.length <= 10) {
            setFormData({ ...formData, phone: value });
        }
    };


    useEffect(() => {
        fetchAgencies();
    }, []);

    // Agency search
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
        }, 200); // debounce 400ms

        return () => clearTimeout(delay);
    }, [agencySearch, agencyDropdownOpen]);

    useEffect(() => {
        if (!isOpen) {
            SetModuleAgency(false);   // 🔥 Reset agency modal
        }
    }, [isOpen]);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        amount: "",
        agency: "",
        frequency: "",
        duration: "",
        startDate: "",
        endDate: ""
    });

    const getDuration = (start, end) => {
        if (!start || !end) return "";

        const s = new Date(start);
        const e = new Date(end);

        const months =
            (e.getFullYear() - s.getFullYear()) * 12 +
            (e.getMonth() - s.getMonth());

        if (months <= 3) return "3 months";
        if (months <= 6) return "6 months";
        if (months <= 12) return "12 months";
        if (months <= 18) return "18 months";
        if (months <= 24) return "24 months";

        return `${months} months`;
    };


    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.person_name || "",
                phone: editData.person_phone || "",
                amount: editData.contract_amount || "",
                agency: editData.agency?.id || "",
                frequency: editData.contract_frequency || "",
                startDate: editData.contract_start_date || "",
                endDate: editData.contract_end_date || "",

                // 👇 duration calculate
                duration: getDuration(
                    editData.contract_start_date,
                    editData.contract_end_date
                )
            });
            setAgencySearch(editData.agency?.name || "");
        }
    }, [editData]);

    const calculateEndDate = (startDate, duration) => {
        if (!startDate || !duration) return "";

        const months = parseInt(duration); // "12 months" → 12

        const start = new Date(startDate);
        start.setMonth(start.getMonth() + months);

        return start.toLocaleDateString("en-CA");

        // ✅ Only date format
        // return start.toISOString().slice(0, 10);
        // return start.toISOString();
    };
    // Click outside handler
    // useEffect(() => {
    //     const handleClickOutside = (event) => {
    //         if (!event.target.closest('[data-location-dropdown]')) {
    //             setShowLocationDropdown(false);
    //         }
    //     };

    //     document.addEventListener('mousedown', handleClickOutside);
    //     return () => {
    //         document.removeEventListener('mousedown', handleClickOutside);
    //     };
    // }, []);

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

            update("agency", res.data.id);

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
    const update = useCallback((path, value) => {
        setFormData((prev) => {
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



    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            person_name: formData.name,
            person_phone: formData.phone,
            contract_amount: Number(formData.amount),
            gp_id: editData?.gp_id || gpId,   // 👈 ADD THIS
            agency_id: Number(formData.agency),
            contract_frequency: formData.frequency,
            contract_start_date: formData.startDate,

            // 👇 duration se end date
            contract_end_date: calculateEndDate(
                formData.startDate,
                formData.duration
            )
        };
        if (formData.phone.length !== 10) {
            setError("Phone number must be exactly 10 digits ❌");
            return;
        }
        if (editData?.id) {
            try {
                setSaving(true)
                console.log("Update Payload:", payload);

                await apiClient.put(
                    `/contractors/contractors/${editData.id}`,
                    payload
                );

                // alert("Contractor Updated Successfully ✅");

                await onsuccess?.();
                onClose(); // modal close

            } catch (error) {
                console.error("Update Error:", error);
                alert("Update Failed ❌");
            } finally {
                setSaving(false)
            }
        } else {
            try {
                setSaving(true)
                console.log("Update Payload:", payload);

                await apiClient.post(
                    `/contractors/contractors`,
                    payload
                );

                alert("Contractor ADD Successfully ✅");

                await onsuccess?.();
                console.log('payload in try-> ', payload)
                onClose(); // modal close

            } catch (error) {
                console.log('payload in error-> ', payload)
                console.error("Full Error:", error.response?.data);
                alert("Update Failed ❌");
            } finally {
                setSaving(false)
            }
            console.log('payload in -> ', payload)
        }
    };


    return (
        <div className='fixed top-0 left-0 bg-black/50 w-full h-full '>

            <div className="w-[700px] fixed top-1/2 left-1/2 -translate-x-1/2 z-10 -translate-y-1/2 h-[500px] bg-white p-9 rounded-2xl ">
                {/* header */}
                <div className='p-4! border-b border-gray-300 flex justify-between '>
                    <h1 className='text-2xl font-semibold'>{editData ? 'Edit' : 'Add'} Contractor Details</h1>
                    <button
                        onClick={onClose}
                        className='text-2xl cursor-pointer'
                    ><X /></button>
                </div>

                {/* content */}
                <form onSubmit={handleSubmit} className='flex justify-between flex-col '>
                    <div className='flex justify-between gap-5 py-2! px-4! w-full'>
                        <div className='flex flex-col  gap-5 w-1/2'>
                            <div className='flex flex-col gap-1 w-full'>
                                <label htmlFor="">Name  </label>
                                <input
                                    autoComplete='off'
                                    className='border-[#d1d5db] border  p-1! w-full text-md rounded '
                                    type="text"
                                    name='person_name'
                                    required
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className='flex flex-col gap-1 '>
                                <label htmlFor="">Work order amount   </label>

                                <input
                                    type="text"
                                    autoComplete='off'
                                    name="contract_amount"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        setFormData({ ...formData, amount: value });
                                    }}
                                    placeholder="Enter amount"
                                    className="border border-[#d1d5db] p-1! w-full rounded"
                                />

                            </div>

                            {/* Agency Filed */}
                            <div className=''>
                                <div className='text-end'>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setErrorInagency(null);
                                            SetModuleAgency(true);
                                        }}
                                        style={{
                                            color: '#10b981',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            cursor: 'pointer'
                                        }}
                                        className='uppercase'
                                    >
                                        + ADD Agency
                                    </button>
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
                                                        setFormData(prev => ({ ...prev, agency: agency.id }));
                                                        setAgencySearch(agency.name);
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


                            {/* <div className='flex flex-col gap-1 w-full'>
                                <label htmlFor="">Agency   </label>
                                <select
                                    value={formData.agency}
                                    onChange={(e) =>
                                        setFormData({ ...formData, agency: e.target.value })
                                    }
                                    style={{
                                        padding: "8px 10px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        outline: "none",
                                        backgroundColor: "white"
                                    }}
                                >
                                    <option value="">Select Agency</option>

                                    {agencies.map((agency) => (
                                        <option key={agency.id} value={agency.id}>
                                            {agency.name}
                                        </option>
                                    ))}
                                </select>

                            </div> */}

                            <div className='flex flex-col gap-1 w-full'>
                                <label htmlFor="">Frequency of work </label>
                                <select
                                    style={{
                                        padding: '8px 10px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        backgroundColor: 'white'
                                    }}

                                    value={formData.frequency}
                                    required
                                    onChange={(e) =>
                                        setFormData({ ...formData, frequency: e.target.value })
                                    }
                                >
                                    <option value="">Select Frequency</option>   {/* 👈 ADD */}
                                    <option value="DAILY">Daily</option>
                                    <option value="WEEKLY">Weekly</option>
                                    <option value="ONCE_IN_THREE_DAYS">Once in 3 days</option>
                                    <option value="MONTHLY">Monthly</option>
                                </select>



                            </div>


                        </div>
                        <div className='flex flex-col gap-5  w-1/2'>
                            <div className='flex flex-col gap-1  w-full'>
                                <label htmlFor="">Phone Number  </label>
                                <input
                                    type="text"
                                    name="person_phone"
                                    autoComplete='off'
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    maxLength={10}
                                    required
                                    placeholder="Enter 10 digit phone"
                                    className="border border-[#d1d5db] p-1! rounded w-full"
                                />

                            </div>
                            <div className='flex flex-col gap-1  w-full'>
                                <label htmlFor="">Work order date  </label>
                                <input
                                    name='contract_start_date'
                                    className='border-[#d1d5db] border p-1! text-md  rounded w-full '
                                    type="date"
                                    value={formData.startDate?.slice(0, 10)}
                                    onChange={(e) =>
                                        setFormData({ ...formData, startDate: e.target.value })
                                    }
                                />
                            </div>

                            <div className='flex flex-col gap-1 w-full'>
                                <label htmlFor="">Duration of work   </label>
                                <select
                                    style={{
                                        padding: "8px 10px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        outline: "none",
                                        backgroundColor: "white"
                                    }}
                                    value={formData.duration}
                                    required
                                    onChange={(e) =>
                                        setFormData({ ...formData, duration: e.target.value })
                                    }
                                >
                                    <option value="">Select Duration</option>
                                    <option value="3 months">3 months</option>
                                    <option value="6 months">6 months</option>
                                    <option value="12 months">12 months</option>
                                    <option value="18 months">18 months</option>
                                    <option value="24 months">24 months</option>
                                </select>


                            </div>

                        </div>
                    </div>

                    <div className='p-5! relative'>
                        <span className='text-sm absolute -top-2 left-5 text-red-500  p-1!'>{error}</span>

                        <button disabled={saving} type='submit' className='w-full rounded p-2! uppercase text-white bg-[#009B56] cursor-pointer transition hover:bg-[#168e58]'>
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </form>
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
                                disabled={loading}
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
                                {loading ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>


    )


}


export default EditContractorDetails    