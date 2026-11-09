import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { AssignStaffBranchDto } from './dto/assign-staff-branch.dto.js';
import { EndStaffBranchDto } from './dto/end-staff-branch.dto.js';

@Injectable()
export class StaffBranchService {
  constructor(private readonly prismaService: PrismaService) {}

  async assignStaffToBranch(
    staffId: string,
    assignStaffBranchDto: AssignStaffBranchDto,
  ) {
    const { branchId } = assignStaffBranchDto;

    const [staff, branch] = await Promise.all([
      this.prismaService.client.staff.findUnique({
        where: { idStaff: staffId },
        select: {
          idStaff: true,
          isActive: true,
        },
      }),
      this.prismaService.client.branch.findUnique({
        where: { idBranch: branchId },
        select: {
          idBranch: true,
          isActive: true,
        },
      }),
    ]);

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!staff.isActive) {
      throw new BadRequestException(
        'Cannot assign an inactive staff member',
      );
    }

    if (!branch.isActive) {
      throw new BadRequestException(
        'Cannot assign staff to an inactive branch',
      );
    }

    const existingAssignment =
      await this.prismaService.client.staffBranch.findFirst({
        where: {
          staffId,
          branchId,
          isActive: true,
        },
        select: {
          idStaffBranch: true,
        },
      });

    if (existingAssignment) {
      throw new ConflictException(
        'Staff member is already assigned to this branch',
      );
    }

    try {
      return await this.prismaService.client.staffBranch.create({
        data: {
          staffId,
          branchId,
        },
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'This staff branch assignment already exists',
        );
      }

      throw error;
    }
  }

  async findStaffBranches(staffId: string) {
    const staff = await this.prismaService.client.staff.findUnique({
      where: { idStaff: staffId },
      select: {
        idStaff: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    return this.prismaService.client.staffBranch.findMany({
      where: { staffId },
      orderBy: {
        startDate: 'desc',
      },
      include: {
        branch: true,
      },
    });
  }

  async findBranchStaff(branchId: string) {
      const branch = await this.prismaService.client.branch.findUnique({
          where: { idBranch: branchId },
          select: {
              idBranch: true,
          },
      });

      if (!branch) {
          throw new NotFoundException('Branch not found');
      }

      return this.prismaService.client.staffBranch.findMany({
          where: { branchId },
          orderBy: {
              startDate: 'desc',
          },
          include: {
              staff: {
                  select: {
                      idStaff: true,
                      userId: true,
                      staffNumber: true,
                      position: true,
                      specialty: true,
                      isActive: true,
                      user: {
                          select: {
                              idUser: true,
                              firstName: true,
                              lastName: true,
                              email: true,
                              mobileNumber: true,
                              role: true,
                          },
                      },
                  },
              },
          },
      });
  }

  async endStaffBranchAssignment(
    staffId: string,
    idStaffBranch: string,
    endStaffBranchDto: EndStaffBranchDto,
  ) {
    const assignment =
      await this.prismaService.client.staffBranch.findFirst({
        where: {
          idStaffBranch,
          staffId,
        },
      });

    if (!assignment) {
      throw new NotFoundException('Staff branch assignment not found');
    }

    if (!assignment.isActive) {
      throw new BadRequestException(
        'This staff branch assignment has already ended',
      );
    }

    const endDate = endStaffBranchDto.endDate
      ? new Date(endStaffBranchDto.endDate)
      : new Date();

    if (endDate <= assignment.startDate) {
      throw new BadRequestException(
        'End date must be later than the assignment start date',
      );
    }

    return this.prismaService.client.staffBranch.update({
      where: { idStaffBranch },
      data: {
        endDate,
        isActive: false,
      },
    });
  }

  async hasActiveBranchAssignment(
    userId: string,
    branchId: string,
    at: Date = new Date(),
  ): Promise<boolean> {
    const assignment = await this.prismaService.client.staffBranch.findFirst({
      where: {
        branchId,
        isActive: true,
        startDate: {
          lte: at,
        },
        OR: [
          {
            endDate: null,
          },
          {
            endDate: {
              gte: at,
            },
          },
        ],
        staff: {
          userId,
          isActive: true,
        },
      },
      select: {
        idStaffBranch: true,
      },
    });

    return assignment !== null;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}