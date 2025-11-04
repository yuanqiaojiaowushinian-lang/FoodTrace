'use client';

import React from 'react';

export default function Modal({
                                  open,
                                  title = '提示',
                                  message,
                                  onClose,
                              }: {
    open: boolean;
    title?: string;
    message: string;
    onClose: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h3 className="text-lg font-semibold mb-3">{title}</h3>
                <p className="text-sm text-gray-700">{message}</p>
                <div className="mt-6 flex justify-end">
                    <button
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                        onClick={onClose}
                    >
                        知道了
                    </button>
                </div>
            </div>
        </div>
    );
}
