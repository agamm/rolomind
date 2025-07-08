"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText, Download, Upload, CheckCircle2 } from "lucide-react"

interface Step {
  title: string
  description: React.ReactNode
  icon: React.ReactNode
  action: string
}

interface Platform {
  platform: string
  color: string
  url: string
  steps: Step[]
}

const steps: Platform[] = [
  {
    platform: "LinkedIn",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    url: "https://www.linkedin.com/mypreferences/d/download-my-data",
    steps: [
      {
        title: "Visit LinkedIn Data Download",
        description: (
          <>Go to <a href="https://www.linkedin.com/mypreferences/d/download-my-data" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">LinkedIn&apos;s data download page</a></>
        ),
        icon: <ExternalLink className="w-4 h-4" />,
        action: "Click the link above to open LinkedIn"
      },
      {
        title: "Select Data to Download",
        description: "Choose 'Connections' from the available data types",
        icon: <CheckCircle2 className="w-4 h-4" />,
        action: "Check the box next to 'Connections'"
      },
      {
        title: "Request Archive",
        description: "Click 'Request archive' and wait for the download link",
        icon: <Download className="w-4 h-4" />,
        action: "You'll receive an email when ready (usually within 24 hours)"
      },
      {
        title: "Download & Extract",
        description: "Download the ZIP file and extract the CSV file",
        icon: <FileText className="w-4 h-4" />,
        action: "Look for 'Connections.csv' in the extracted folder"
      },
      {
        title: "Import to Rolomind",
        description: "Upload the CSV file using the import button",
        icon: <Upload className="w-4 h-4" />,
        action: "Use the 'Import CSV' button on the contacts page"
      }
    ]
  },
  {
    platform: "Google",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    url: "https://takeout.google.com/",
    steps: [
      {
        title: "Visit Google Takeout",
        description: (
          <>Go to <a href="https://takeout.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">Google Takeout</a> to export your data</>
        ),
        icon: <ExternalLink className="w-4 h-4" />,
        action: "Click the link above to open Google Takeout"
      },
      {
        title: "Deselect All",
        description: "First click 'Deselect all' to clear all selections",
        icon: <CheckCircle2 className="w-4 h-4" />,
        action: "This ensures you only get the contacts data"
      },
      {
        title: "Select Contacts",
        description: "Find and select only 'Contacts' from the list",
        icon: <CheckCircle2 className="w-4 h-4" />,
        action: "Scroll down to find 'Contacts' and check the box"
      },
      {
        title: "Choose CSV Format",
        description: "Click on 'vCard format' button and change to 'CSV'",
        icon: <FileText className="w-4 h-4" />,
        action: "Select 'CSV' from the dropdown instead of vCard format"
      },
      {
        title: "Create Export",
        description: "Click 'Next Step' then 'Create Export'",
        icon: <Download className="w-4 h-4" />,
        action: "You'll receive an email when the export is ready"
      },
      {
        title: "Download & Import",
        description: "Download the ZIP file, extract, and import the CSV",
        icon: <Upload className="w-4 h-4" />,
        action: "Look for the contacts CSV file in the extracted folder"
      }
    ]
  }
]

export function ImportHelpTab() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Import Your Contacts</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Follow these step-by-step guides to export your contacts from LinkedIn and Google
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {steps.map((platform) => (
          <Card key={platform.platform} className="h-fit">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{platform.platform} Contacts</CardTitle>
                <Badge className={platform.color}>{platform.platform}</Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="w-fit"
                onClick={() => window.open(platform.url, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open {platform.platform}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {platform.steps.map((step, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">{step.icon}</span>
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">{step.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">{step.action}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Tips for Success</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Both platforms may take several hours to prepare your data</li>
                <li>• Check your email for download links from LinkedIn/Google</li>
                <li>• The CSV files should contain contact names, emails, and other details</li>
                <li>• After downloading, use the &quot;Import CSV&quot; button on your contacts page</li>
                <li>• Rolomind will automatically detect and format the contact data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}