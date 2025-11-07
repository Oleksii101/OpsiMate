import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServicesBL } from '../src/bl/services/services.bl';
import { ServiceRepository } from '../src/dal/serviceRepository';
import { AuditBL } from '../src/bl/audit/audit.bl';
import { Service, User, AuditActionType, AuditResourceType } from '@OpsiMate/shared';
import { passwordResetTemplate } from '../src/utils/mailTemplate';
import { UserRepository } from '../src/dal/userRepository';
import { MailClient } from '../src/dal/external-client/mail-client';
import { PasswordResetsRepository } from '../src/dal/passwordResetsRepository';

describe('Server Tests - 4 test functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// Test 1: passwordResetTemplate - jednoduchý unit test bez mocks
	it('test 1: passwordResetTemplate should generate email template with reset URL', () => {
		const resetUrl = 'https://example.com/reset-password?token=abc123';
		const userName = 'John Doe';

		const template = passwordResetTemplate(resetUrl, userName);

		expect(template).toContain('Reset Your Password');
		expect(template).toContain(resetUrl);
		expect(template).toContain(userName);
		expect(template).toContain('Hi John Doe,');
		expect(template).toContain('Reset Password');
		expect(template).toContain('15 minutes');
		expect(template).toContain('OpsiMate');
	});

	// Test 2: passwordResetTemplate without userName
	it('test 2: passwordResetTemplate should work without userName', () => {
		const resetUrl = 'https://example.com/reset-password?token=abc123';

		const template = passwordResetTemplate(resetUrl);

		expect(template).toContain('Hello,');
		expect(template).toContain(resetUrl);
		expect(template).not.toContain('Hi');
		expect(template).toContain('OpsiMate');
	});

	// Test 3: ServicesBL.createService - používa MOCK pre repository
	it('test 3: ServicesBL.createService should create service using mocked repository', async () => {
		// MOCK: Vytvorenie fake/mock repositories
		const mockServiceRepo = {
			createService: vi.fn(),
			getServiceById: vi.fn(),
			deleteService: vi.fn(),
		} as unknown as vi.Mocked<ServiceRepository>;

		const mockAuditBL = {
			logAction: vi.fn(),
		} as unknown as vi.Mocked<AuditBL>;

		const servicesBL = new ServicesBL(mockServiceRepo, mockAuditBL);

		const serviceToCreate = {
			name: 'Test Service',
			providerId: 1,
			type: 'http' as const,
			status: 'running' as const,
			externalUrl: 'https://example.com',
		};

		const createdService: Service = {
			id: 1,
			...serviceToCreate,
			createdAt: new Date(),
		};

		// MOCK: Nastavenie mock repository aby vracal očakávané hodnoty
		mockServiceRepo.createService.mockResolvedValue({
			lastID: 1,
		} as any);
		mockServiceRepo.getServiceById.mockResolvedValue(createdService);
		mockAuditBL.logAction.mockResolvedValue();

		const mockUser: User = {
			id: 1,
			email: 'test@example.com',
			fullName: 'Test User',
			role: 'admin',
		};

		const result = await servicesBL.createService(serviceToCreate, mockUser);

		expect(result).toEqual(createdService);
		expect(mockServiceRepo.createService).toHaveBeenCalledWith(serviceToCreate);
		expect(mockServiceRepo.getServiceById).toHaveBeenCalledWith(1);
		expect(mockAuditBL.logAction).toHaveBeenCalledWith({
			actionType: AuditActionType.CREATE,
			resourceType: AuditResourceType.SERVICE,
			resourceId: '1',
			userId: mockUser.id,
			userName: mockUser.fullName,
			resourceName: serviceToCreate.name,
		});
	});

	// Test 4: ServicesBL.deleteService - používa MOCK pre repository
	it('test 4: ServicesBL.deleteService should delete service using mocked repository', async () => {
		// MOCK: Vytvorenie fake/mock repositories
		const mockServiceRepo = {
			getServiceById: vi.fn(),
			deleteService: vi.fn(),
		} as unknown as vi.Mocked<ServiceRepository>;

		const mockAuditBL = {
			logAction: vi.fn(),
		} as unknown as vi.Mocked<AuditBL>;

		const servicesBL = new ServicesBL(mockServiceRepo, mockAuditBL);

		const serviceId = 1;
		const serviceToDelete: Service = {
			id: serviceId,
			name: 'Test Service',
			providerId: 1,
			type: 'http' as const,
			status: 'running' as const,
			createdAt: new Date(),
		};

		mockServiceRepo.getServiceById.mockResolvedValue(serviceToDelete);
		mockServiceRepo.deleteService.mockResolvedValue();
		mockAuditBL.logAction.mockResolvedValue();

		const mockUser: User = {
			id: 1,
			email: 'test@example.com',
			fullName: 'Test User',
			role: 'admin',
		};

		await servicesBL.deleteService(serviceId, mockUser);

		expect(mockServiceRepo.getServiceById).toHaveBeenCalledWith(serviceId);
		expect(mockServiceRepo.deleteService).toHaveBeenCalledWith(serviceId);
		expect(mockAuditBL.logAction).toHaveBeenCalledWith({
			actionType: AuditActionType.DELETE,
			resourceType: AuditResourceType.SERVICE,
			resourceId: String(serviceId),
			userId: mockUser.id,
			userName: mockUser.fullName,
			resourceName: serviceToDelete.name,
		});
	});
});
