import { BadRequestException } from '@nestjs/common';
import { fromZonedTime } from 'date-fns-tz';
import { WeekDay } from '../../../generated/prisma/enums.js';

const WEEK_DAYS: Record<number, WeekDay> = {
    0: WeekDay.SUNDAY,
    1: WeekDay.MONDAY,
    2: WeekDay.TUESDAY,
    3: WeekDay.WEDNESDAY,
    4: WeekDay.THURSDAY,
    5: WeekDay.FRIDAY,
    6: WeekDay.SATURDAY,
};

export interface LocalDayRange {
    dayStartsAt: Date;
    dayEndsAt: Date;
    weekDay: WeekDay;
}

export function validateDate(date: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new BadRequestException(
            'Date must use the YYYY-MM-DD format',
        );
    }

    const [year, month, day] = date.split('-').map(Number);

    const parsedDate = new Date(
        Date.UTC(year, month - 1, day),
    );

    const normalizedDate = [
        parsedDate.getUTCFullYear(),
        String(parsedDate.getUTCMonth() + 1).padStart(2, '0'),
        String(parsedDate.getUTCDate()).padStart(2, '0'),
    ].join('-');

    if (normalizedDate !== date) {
        throw new BadRequestException(
            'Date must be a valid calendar date',
        );
    }
}

export function validateTimeZone(timeZone: string): void {
    try {
        Intl.DateTimeFormat('en-US', {
            timeZone,
        });
    } catch {
        throw new BadRequestException(
            'Branch has an invalid time zone configuration',
        );
    }
}

export function getLocalDayRange(
    date: string,
    timeZone: string,
): LocalDayRange {
    validateDate(date);
    validateTimeZone(timeZone);

    const [year, month, day] = date.split('-').map(Number);

    const nextDay = new Date(
        Date.UTC(year, month - 1, day + 1),
    );

    const nextDate = [
        nextDay.getUTCFullYear(),
        String(nextDay.getUTCMonth() + 1).padStart(2, '0'),
        String(nextDay.getUTCDate()).padStart(2, '0'),
    ].join('-');

    const weekdayNumber = new Date(
        Date.UTC(year, month - 1, day),
    ).getUTCDay();

    return {
        dayStartsAt: fromZonedTime(
            `${date}T00:00:00`,
            timeZone,
        ),
        dayEndsAt: fromZonedTime(
            `${nextDate}T00:00:00`,
            timeZone,
        ),
        weekDay: WEEK_DAYS[weekdayNumber],
    };
}