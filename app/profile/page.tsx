"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { getFirestore, doc, setDoc } from "firebase/firestore"
import { auth } from "@/lib/firebase"

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    name: string;
    age: string;
    gender: string;
    bloodGroup: string;
    allergies: string[];
    medicalConditions: string[];
    medications: string[];
    emergencyContact: string;
  }>({
    name: "",
    age: "",
    gender: "",
    bloodGroup: "",
    allergies: [],
    medicalConditions: [],
    medications: [],
    emergencyContact: ""
  })
  const [bloodGroupOpen, setBloodGroupOpen] = useState(false);
  const [allergiesOpen, setAllergiesOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [medicalConditionsOpen, setMedicalConditionsOpen] = useState(false);
  const [medicationsOpen, setMedicationsOpen] = useState(false);
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const allergyOptions = [
    "None", "Penicillin", "Peanuts", "Shellfish", "Latex", "Pollen", "Dust", "Eggs", "Milk", "Other"
  ];
  const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];
  const medicalConditionOptions = [
    "None", "Diabetes", "Hypertension", "Asthma", "Heart Disease", "Thyroid", "Arthritis", "Cancer", "Other"
  ];
  const medicationOptions = [
    "None", "Metformin", "Aspirin", "Insulin", "Lisinopril", "Atorvastatin", "Levothyroxine", "Other"
  ];
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const db = typeof window !== "undefined" ? getFirestore() : undefined

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, selectedOptions } = e.target
    setProfile({
      ...profile,
      [name]: Array.from(selectedOptions, option => option.value)
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth?.currentUser || !db) return
    setSaving(true)
    try {
      await setDoc(doc(db, "profiles", auth.currentUser.uid), profile)
      setSuccess(true)
    } catch (err) {
      setSuccess(false)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-card/50 p-8">
      <div className="max-w-5xl mx-auto">
        <Card className="w-full border-2 border-black shadow-lg rounded-xl">
          <CardContent className="p-10">
            <h2 className="text-3xl font-bold mb-10 text-center text-foreground">Your Medical Profile</h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 w-full" onSubmit={handleSave}>
              <div className="flex flex-col gap-2 justify-center w-full min-w-0">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <input name="name" type="text" placeholder="Full Name" value={profile.name} onChange={handleChange} className="min-w-[200px] max-w-[350px] w-full px-4 py-2 rounded-lg border-2 border-black bg-gradient-to-br from-secondary/10 via-background to-card/30 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 shadow-sm" required />
              </div>
              
              <div className="flex flex-col gap-2 justify-center w-full min-w-0">
                <label className="text-sm font-medium text-foreground">Age</label>
                <input name="age" type="number" placeholder="Age" value={profile.age} onChange={handleChange} className="w-24 px-4 py-2 rounded-lg border-2 border-black bg-gradient-to-br from-secondary/10 via-background to-card/30 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 shadow-sm" required />
              </div>
              
              <div className="flex flex-col gap-2 relative justify-center w-full min-w-0">
                <label className="text-sm font-medium text-foreground">Gender</label>
                <input
                  name="gender"
                  type="text"
                  placeholder="Select Gender"
                  value={profile.gender}
                  onChange={handleChange}
                  onFocus={() => setGenderOpen(true)}
                  onBlur={() => setTimeout(() => setGenderOpen(false), 150)}
                  className="w-40 px-4 py-2 rounded-lg border-2 border-black bg-gradient-to-br from-secondary/10 via-background to-card/30 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 shadow-sm cursor-pointer"
                  autoComplete="off"
                />
                {genderOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black rounded-lg shadow-lg">
                    {genderOptions.map(option => (
                      <div
                        key={option}
                        className="px-4 py-2 cursor-pointer hover:bg-primary/20 rounded-md transition-all"
                        onMouseDown={() => {
                          setProfile({ ...profile, gender: option });
                          setGenderOpen(false);
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 relative justify-center w-full min-w-0">
                <label className="text-sm font-medium text-foreground">Blood Group</label>
                <input
                  name="bloodGroup"
                  type="text"
                  placeholder="Blood Group"
                  value={profile.bloodGroup}
                  onChange={handleChange}
                  onFocus={() => setBloodGroupOpen(true)}
                  onBlur={() => setTimeout(() => setBloodGroupOpen(false), 150)}
                  className="w-32 px-4 py-2 rounded-lg border-2 border-black bg-gradient-to-br from-secondary/10 via-background to-card/30 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 shadow-sm cursor-pointer"
                  autoComplete="off"
                />
                {bloodGroupOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black rounded-lg shadow-lg">
                    {bloodGroups.map(bg => (
                      <div
                        key={bg}
                        className="px-4 py-2 cursor-pointer hover:bg-primary/20 rounded-md transition-all"
                        onMouseDown={() => {
                          setProfile({ ...profile, bloodGroup: bg });
                          setBloodGroupOpen(false);
                        }}
                      >
                        {bg}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 relative justify-center w-full min-w-0">
                <label className="text-sm font-medium text-foreground">Allergies</label>
                <input
                  name="allergies"
                  type="text"
                  placeholder={profile.allergies.length ? profile.allergies.join(", ") : "Select Allergies"}
                  value={""}
                  onFocus={() => setAllergiesOpen(true)}
                  onBlur={() => setTimeout(() => setAllergiesOpen(false), 150)}
                  className="min-w-[200px] max-w-[350px] w-full px-4 py-2 rounded-lg border-2 border-black bg-gradient-to-br from-secondary/10 via-background to-card/30 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 shadow-sm cursor-pointer"
                  readOnly
                  autoComplete="off"
                />
                {allergiesOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black rounded-lg shadow-lg">
                    {allergyOptions.map(option => (
                      <div
                        key={option}
                        className={`px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-primary/20 rounded-md transition-all ${profile.allergies.includes(option) ? "bg-primary/10" : ""}`}
                        onMouseDown={e => {
                          e.preventDefault();
                          setProfile(prev => {
                            const alreadySelected = prev.allergies.includes(option);
                            let newAllergies;
                            if (alreadySelected) {
                              newAllergies = prev.allergies.filter(a => a !== option);
                            } else {
                              newAllergies = [...prev.allergies, option];
                            }
                            return { ...prev, allergies: newAllergies };
                          });
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={profile.allergies.includes(option)}
                          readOnly
                          className="h-4 w-4 accent-primary"
                        />
                        <span className="text-sm">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 relative justify-center w-full min-w-0">
                <label className="text-sm font-medium text-foreground">Medical Conditions</label>
                <input
                  name="medicalConditions"
                  type="text"
                  placeholder={profile.medicalConditions.length ? profile.medicalConditions.join(", ") : "Select Medical Conditions"}
                  value={""}
                  onFocus={() => setMedicalConditionsOpen(true)}
                  onBlur={() => setTimeout(() => setMedicalConditionsOpen(false), 150)}
                  className="min-w-[200px] max-w-[350px] w-full px-4 py-2 rounded-lg border-2 border-black bg-gradient-to-br from-secondary/10 via-background to-card/30 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 shadow-sm cursor-pointer"
                  readOnly
                  autoComplete="off"
                />
                {medicalConditionsOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black rounded-lg shadow-lg">
                    {medicalConditionOptions.map(option => (
                      <div
                        key={option}
                        className={`px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-primary/20 rounded-md transition-all ${profile.medicalConditions.includes(option) ? "bg-primary/10" : ""}`}
                        onMouseDown={e => {
                          e.preventDefault();
                          setProfile(prev => {
                            const alreadySelected = prev.medicalConditions.includes(option);
                            let newConditions;
                            if (alreadySelected) {
                              newConditions = prev.medicalConditions.filter(c => c !== option);
                            } else {
                              newConditions = [...prev.medicalConditions, option];
                            }
                            return { ...prev, medicalConditions: newConditions };
                          });
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={profile.medicalConditions.includes(option)}
                          readOnly
                          className="h-4 w-4 accent-primary"
                        />
                        <span className="text-sm">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 relative justify-center">
                <label className="text-sm font-medium text-foreground">Medications</label>
                <input
                  name="medications"
                  type="text"
                  placeholder={profile.medications.length ? profile.medications.join(", ") : "Select Medications"}
                  value={""}
                  onFocus={() => setMedicationsOpen(true)}
                  onBlur={() => setTimeout(() => setMedicationsOpen(false), 150)}
                  className="min-w-[200px] max-w-[350px] w-full px-4 py-2 rounded-lg border-2 border-black bg-gradient-to-br from-secondary/10 via-background to-card/30 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 shadow-sm cursor-pointer"
                  readOnly
                  autoComplete="off"
                />
                {medicationsOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black rounded-lg shadow-lg">
                    {medicationOptions.map(option => (
                      <div
                        key={option}
                        className={`px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-primary/20 rounded-md transition-all ${profile.medications.includes(option) ? "bg-primary/10" : ""}`}
                        onMouseDown={e => {
                          e.preventDefault();
                          setProfile(prev => {
                            const alreadySelected = prev.medications.includes(option);
                            let newMedications;
                            if (alreadySelected) {
                              newMedications = prev.medications.filter(m => m !== option);
                            } else {
                              newMedications = [...prev.medications, option];
                            }
                            return { ...prev, medications: newMedications };
                          });
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={profile.medications.includes(option)}
                          readOnly
                          className="h-4 w-4 accent-primary"
                        />
                        <span className="text-sm">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 justify-center w-full min-w-0">
                <label className="text-sm font-medium text-foreground">Emergency Contact</label>
                <input name="emergencyContact" type="text" placeholder="Emergency Contact" value={profile.emergencyContact} onChange={handleChange} className="min-w-[200px] max-w-[350px] w-full px-4 py-2 rounded-lg border-2 border-black bg-gradient-to-br from-secondary/10 via-background to-card/30 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 shadow-sm" />
              </div>
              
              <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-8">
                <motion.div whileHover={{ scale: 1.04, boxShadow: "0 0 12px #e75480" }} className="w-full max-w-md">
                  <Button type="submit" className="w-full border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300" disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                </motion.div>
              </div>
              
              {success && (
                <div className="md:col-span-2 lg:col-span-3 flex justify-center">
                  <p className="text-green-600 text-center mt-2">Profile saved!</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
