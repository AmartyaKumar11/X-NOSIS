"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Stethoscope, Shield, Zap } from 'lucide-react'
import Link from "next/link"
import Typewriter from "@/components/typewriter"

export default function LandingPage() {
  const [showMain, setShowMain] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      if (!showMain && window.scrollY > 10) {
        setShowMain(true);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [showMain]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-card/50">
      {/* Fullscreen typewriter intro as first slide */}
      {!showMain && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: showMain ? 0 : 1 }}
          transition={{ duration: 0.7 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
        >
          <Stethoscope className="h-20 w-20 text-primary mb-8 mx-auto" />
          <Typewriter text="X-NOSIS" speed={120} eraseSpeed={60} pause={1200} loop={true} />
          <p className="text-muted-foreground text-lg mt-8">Scroll down to begin</p>
        </motion.div>
      )}
      {/* Spacer only while typewriter intro is visible */}
      {!showMain && <div style={{ height: '50vh' }} />}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: showMain ? 0 : 100, opacity: showMain ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        className={`container mx-auto px-4 pt-40 pb-16`}
      >
        {/* Removed header to reclaim space for main content */}
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showMain ? 1 : 0, y: showMain ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Medical Intelligence
            <br />
            <span className="text-primary">At Your Fingertips</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get instant, accurate medical insights powered by advanced AI. Analyse reports, ask questions, and receive professional-grade assistance.
          </p>
          <Link href="/dashboard">
            <motion.div 
              whileHover={{ scale: 1.05, boxShadow: "0 0 16px #e75480" }} 
              style={{ display: 'inline-block', background: 'transparent' }}
              className="bg-transparent"
            >
              <Button
                size="lg"
                className="text-lg px-8 py-6 rounded-md border-2 border-black bg-transparent shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Begin Diagnosis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
        {/* Features */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showMain ? 1 : 0, y: showMain ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          <motion.div whileHover={{ scale: 1.04, boxShadow: "0 0 12px #e75480" }}>
            <Card className="border-2 border-black shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Instant Analysis</h3>
                <p className="text-muted-foreground">
                  Get immediate insights from your medical documents and questions with AI-powered analysis.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04, boxShadow: "0 0 12px #e75480" }}>
            <Card className="border-2 border-black shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
                <p className="text-muted-foreground">
                  Your medical information is protected with enterprise-grade security and privacy measures.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04, boxShadow: "0 0 12px #e75480" }}>
            <Card className="border-2 border-black shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Stethoscope className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Medical Expertise</h3>
                <p className="text-muted-foreground">
                  Trained on vast medical knowledge to provide accurate, professional-grade assistance.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showMain ? 1 : 0, y: showMain ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <motion.div whileHover={{ scale: 1.04, boxShadow: "0 0 12px #e75480" }}>
            <Card className="border-2 border-black shadow-xl bg-gradient-to-r from-card/80 to-secondary/20">
              <CardContent className="p-12">
                <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
                <p className="text-muted-foreground mb-6 text-lg">
                  Join thousands of healthcare professionals using X-NOSIS for better patient care.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth?redirect=/chat">
                    <motion.div whileHover={{ scale: 1.07, boxShadow: "0 0 16px #e75480" }}>
                      <Button size="lg" className="w-full sm:w-auto rounded-md border-2 border-black shadow-lg hover:shadow-xl transition-all duration-300">
                        Start Chatting
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/auth?redirect=/upload">
                    <motion.div whileHover={{ scale: 1.07, boxShadow: "0 0 16px #e75480" }}>
                      <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-black shadow-lg hover:shadow-xl transition-all duration-300">
                        Analyse Report
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
