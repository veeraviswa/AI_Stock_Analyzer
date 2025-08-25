"use client";

import { UploadCloud } from 'lucide-react';
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  onFileUpload: (content: string, fileName: string) => void;
  setLoading: (loading: boolean) => void;
}

export function FileUploader({ onFileUpload, setLoading }: FileUploaderProps) {
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }
    setLoading(true);
    const file = acceptedFiles[0];
    
    if (file.type !== 'text/csv') {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a CSV file.',
      });
      setLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const fileContent = reader.result as string;
      onFileUpload(fileContent, file.name);
    };
    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'File Read Error',
        description: 'There was an error reading the file.',
      });
      setLoading(false);
    }
    reader.readAsText(file);
  }, [onFileUpload, setLoading, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxFiles: 1,
    accept: {'text/csv': ['.csv']} 
  });

  return (
    <div
      {...getRootProps()}
      className={`mt-4 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
      }`}
    >
      <input {...getInputProps()} />
      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">
        {isDragActive ? 'Drop the CSV file here...' : "Drag 'n' drop a CSV file here, or click to select"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">Date, Open, High, Low, Close, Volume</p>
    </div>
  );
}
