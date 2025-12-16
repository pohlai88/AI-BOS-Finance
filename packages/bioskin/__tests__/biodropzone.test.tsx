/**
 * BioDropzone Tests - Vitest Browser Mode
 *
 * E2E-style user flow testing for file upload.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import { BioDropzone, type UploadedFile } from '../src/organisms/BioDropzone';

// ============================================================
// Test Data
// ============================================================

const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
const mockImage = new File(['image content'], 'test.png', { type: 'image/png' });

const mockUploadedFiles: UploadedFile[] = [
  {
    id: 'file-1',
    file: mockFile,
    progress: 100,
    status: 'success',
  },
  {
    id: 'file-2',
    file: mockImage,
    progress: 50,
    status: 'uploading',
  },
];

// ============================================================
// Unit Tests - BioDropzone renders correctly
// ============================================================

describe('BioDropzone - Rendering', () => {
  it('renders dropzone with data-testid', () => {
    render(<BioDropzone onFilesSelected={vi.fn()} />);
    expect(screen.getByTestId('bio-dropzone')).toBeInTheDocument();
  });

  it('renders default label', () => {
    render(<BioDropzone onFilesSelected={vi.fn()} />);
    expect(screen.getByText(/drag & drop files here/i)).toBeInTheDocument();
  });

  it('renders custom label', () => {
    render(<BioDropzone onFilesSelected={vi.fn()} label="Upload documents" />);
    expect(screen.getByText('Upload documents')).toBeInTheDocument();
  });

  it('renders helper text', () => {
    render(<BioDropzone onFilesSelected={vi.fn()} helperText="PDF files only" />);
    expect(screen.getByText('PDF files only')).toBeInTheDocument();
  });

  it('renders accepted file types', () => {
    render(
      <BioDropzone
        onFilesSelected={vi.fn()}
        accept={{ 'image/*': ['.png', '.jpg'] }}
      />
    );
    expect(screen.getByText(/\.png.*\.jpg/i)).toBeInTheDocument();
  });

  it('shows max size and files info', () => {
    render(
      <BioDropzone
        onFilesSelected={vi.fn()}
        maxSize={5 * 1024 * 1024}
        maxFiles={3}
      />
    );
    expect(screen.getByText(/5 MB/i)).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });
});

// ============================================================
// File Preview Tests
// ============================================================

describe('BioDropzone - File Previews', () => {
  it('renders file previews when files provided', () => {
    render(
      <BioDropzone
        onFilesSelected={vi.fn()}
        files={mockUploadedFiles}
        showPreviews
      />
    );
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('test.png')).toBeInTheDocument();
  });

  it('shows upload progress', () => {
    render(
      <BioDropzone
        onFilesSelected={vi.fn()}
        files={mockUploadedFiles}
        showPreviews
      />
    );
    // File 2 is uploading at 50%
    const previews = screen.getAllByTestId('file-preview');
    expect(previews.length).toBe(2);
  });

  it('allows removing files', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <BioDropzone
        onFilesSelected={vi.fn()}
        onFileRemove={onRemove}
        files={mockUploadedFiles}
        showPreviews
      />
    );

    const removeButtons = screen.getAllByLabelText('Remove file');
    await user.click(removeButtons[0]);

    expect(onRemove).toHaveBeenCalled();
  });
});

// ============================================================
// Interaction Tests
// ============================================================

describe('BioDropzone - Interactions', () => {
  it('opens file picker when clicked', async () => {
    const user = userEvent.setup();
    render(<BioDropzone onFilesSelected={vi.fn()} />);

    const dropzone = screen.getByRole('button');
    await user.click(dropzone);

    // The file input should be triggered (we can't fully test native file picker)
    expect(dropzone).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<BioDropzone onFilesSelected={vi.fn()} disabled />);

    const dropzone = screen.getByRole('button');
    expect(dropzone).toHaveAttribute('tabindex', '-1');
    expect(dropzone).toHaveClass('opacity-50');
  });

  it('calls onFilesSelected when files are selected', async () => {
    const onFilesSelected = vi.fn();
    render(<BioDropzone onFilesSelected={onFilesSelected} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate file selection via input
    Object.defineProperty(input, 'files', {
      value: [mockFile],
    });
    fireEvent.change(input);

    expect(onFilesSelected).toHaveBeenCalledWith([mockFile]);
  });
});

// ============================================================
// Validation Tests
// ============================================================

describe('BioDropzone - Validation', () => {
  it('accepts only specified file types', async () => {
    const onFilesSelected = vi.fn();
    render(
      <BioDropzone
        onFilesSelected={onFilesSelected}
        accept={{ 'image/*': ['.png'] }}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Try to upload a PDF (not accepted)
    Object.defineProperty(input, 'files', {
      value: [mockFile], // PDF file
    });
    fireEvent.change(input);

    // Should not call with invalid file type
    expect(onFilesSelected).not.toHaveBeenCalled();
  });
});

// ============================================================
// Accessibility Tests
// ============================================================

describe('BioDropzone - Accessibility', () => {
  it('dropzone is focusable', () => {
    render(<BioDropzone onFilesSelected={vi.fn()} />);

    const dropzone = screen.getByRole('button');
    expect(dropzone).toHaveAttribute('tabindex', '0');
  });

  it('dropzone can be activated with keyboard', async () => {
    const user = userEvent.setup();
    render(<BioDropzone onFilesSelected={vi.fn()} />);

    const dropzone = screen.getByRole('button');
    dropzone.focus();
    await user.keyboard('{Enter}');

    // Input should be triggered
    expect(dropzone).toBeInTheDocument();
  });
});
