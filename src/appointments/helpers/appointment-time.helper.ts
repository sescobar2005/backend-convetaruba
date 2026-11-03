import { BadRequestException } from '@nestjs/common';

export const SLOT_DURATION_MINUTES = 20;

export function parseTime(time: string): number {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);

    if (!match) {
        throw new BadRequestException(
            `Invalid schedule time: ${time}`,
        );
    }

    return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToTime(minutes: number): string {
    if (
        !Number.isInteger(minutes) ||
        minutes < 0 ||
        minutes >= 24 * 60
    ) {
        throw new BadRequestException(
            'Minutes must represent a valid time of day',
        );
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return [
        String(hours).padStart(2, '0'),
        String(remainingMinutes).padStart(2, '0'),
    ].join(':');
}

export function isSlotAligned(
    startMinutes: number,
    scheduleStartMinutes: number,
): boolean {
    return (
        startMinutes >= scheduleStartMinutes &&
        (startMinutes - scheduleStartMinutes) %
            SLOT_DURATION_MINUTES === 0
    );
}