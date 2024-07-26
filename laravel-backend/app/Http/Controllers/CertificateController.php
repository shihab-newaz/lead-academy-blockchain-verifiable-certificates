<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CertificateController extends Controller
{
    public function issue(Request $request)
    {
        try {
            Log::info('Received certificate issuance request', $request->all());

            $request->validate([
                'fileCid' => 'required|string',
                'studentAddress' => 'required|string',
            ]);

            $response = Http::withoutVerifying()->post(env('BLOCKCHAIN_SERVICE_URL') . '/issue-certificate', [
                'fileCid' => $request->fileCid,
                'studentAddress' => $request->studentAddress,
            ]);

            Log::info('Blockchain service response', ['status' => $response->status(), 'body' => $response->body()]);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Certificate issued successfully',
                    'data' => $response->json()
                ]);
            } else {
                Log::error('Failed to issue certificate', ['response' => $response->body()]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to issue certificate',
                    'error' => $response->body()
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Exception in certificate issuance', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}