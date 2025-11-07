import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapValidationErrors, mapApiError } from './errorMapper';
import { removeDuplicates } from './utils';
import { hasPermission } from './permissions';
import type { ValidationErrorResponse, ValidationErrorDetail } from './errorMapper';
import * as auth from './auth';

// Mock auth module (MOCK)
vi.mock('./auth', () => ({
	getUserRole: vi.fn(),
	getCurrentUser: vi.fn(),
}));

describe('Client Tests - 4 test functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// Test 1: mapValidationErrors - testuje mapovanie validation errors
	it('test 1: mapValidationErrors should map validation error details to field errors', () => {
		const errorResponse: ValidationErrorResponse = {
			success: false,
			error: 'Validation error',
			details: [
				{
					code: 'invalid_string',
					type: 'string',
					message: 'Invalid email',
					path: ['email'],
				},
				{
					code: 'too_small',
					type: 'string',
					message: 'Password too short',
					minimum: 6,
					path: ['password'],
				},
			] as ValidationErrorDetail[],
		};

		const result = mapValidationErrors(errorResponse);

		expect(result).toEqual({
			email: 'Please enter a valid email address',
			password: 'Password must be at least 6 characters long',
		});
	});

	// Test 2: mapApiError - testuje mapovanie API errors
	it('test 2: mapApiError should map HTTP 401 error to user-friendly message', () => {
		const error = 'HTTP 401: Unauthorized';
		const result = mapApiError(error);
		expect(result).toBe('Authentication failed. Please log in again.');
	});

	// Test 3: hasPermission - používa MOCK pre auth.getUserRole
	it('test 3: hasPermission should check permissions using mocked auth', () => {
		// MOCK: Mock getUserRole to return 'admin'
		vi.mocked(auth.getUserRole).mockReturnValue('admin' as any);

		expect(hasPermission('create')).toBe(true);
		expect(hasPermission('edit')).toBe(true);
		expect(hasPermission('delete')).toBe(true);
		expect(hasPermission('view')).toBe(true);
		expect(auth.getUserRole).toHaveBeenCalled();
	});

	// Test 4: removeDuplicates - jednoduchý unit test
	it('test 4: removeDuplicates should remove duplicate objects from array', () => {
		const array = [
			{ id: 1, name: 'John' },
			{ id: 2, name: 'Jane' },
			{ id: 1, name: 'John' },
			{ id: 3, name: 'Bob' },
			{ id: 2, name: 'Jane' },
		];

		const result = removeDuplicates(array, 'id');

		expect(result).toEqual([
			{ id: 1, name: 'John' },
			{ id: 2, name: 'Jane' },
			{ id: 3, name: 'Bob' },
		]);
		expect(result).toHaveLength(3);
	});
});
