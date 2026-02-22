import { X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import apiClient from '../../../services/api';



const EditContractorDetails = ({ isOpen, onClose, editData, onsuccess, gpId }) => {

    const [agencies, setAgencies] = useState([]);
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

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
                            <div className='flex flex-col gap-1 w-full'>
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

                            </div>

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

        </div>


    )


}


export default EditContractorDetails    