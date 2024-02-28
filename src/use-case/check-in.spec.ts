import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryCheckInsRepository } from '@/repositories/in-memory/in-memory-check-ins-repository'
import { CheckInUseCase } from './check-in'
import { InMemoryGymsRepository } from '@/repositories/in-memory/in-memory-gyms-repository'
import { MaxDistanceError } from './errors/max-distance-error'
import { MaxNumberOfCheckInsError } from './errors/max-number-of-check-ins-error'

let checkInsRepository: InMemoryCheckInsRepository
let gymsRepository: InMemoryGymsRepository
let sut: CheckInUseCase

describe('CheckIn Use Case', () => {
  beforeEach(() => {
    checkInsRepository = new InMemoryCheckInsRepository()
    gymsRepository = new InMemoryGymsRepository()
    sut = new CheckInUseCase(checkInsRepository, gymsRepository)

    gymsRepository.create({
      id: 'gym_id',
      title: 'JavaScript Gym',
      description: '',
      phone: '',
      latitude: -27.2092052,
      longitude: -49.6401091,
    })

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Should be able to check in', async () => {
    const { checkIn } = await sut.execute({
      gymId: 'gym_id',
      userId: 'user_id',
      userLatitude: -27.2092052,
      userLongitude: -49.6401091,
    })

    expect(checkIn.id).toEqual(expect.any(String))
  })

  it('Should not be able to check in on distant gym', async () => {
    gymsRepository.create({
      id: 'gym_id-02',
      title: 'JavaScript Gym',
      description: '',
      phone: '',
      latitude: -27.0747279,
      longitude: -49.4889672,
    })

    await expect(() =>
      sut.execute({
        gymId: 'gym_id-02',
        userId: 'user_id',
        userLatitude: -27.2092052,
        userLongitude: -49.6401091,
      }),
    ).rejects.toBeInstanceOf(MaxDistanceError)
  })

  it('Should not be able to check in twice in the same day', async () => {
    vi.setSystemTime(new Date(2024, 1, 21, 8, 0, 0))

    await sut.execute({
      gymId: 'gym_id',
      userId: 'user_id',
      userLatitude: -27.2092052,
      userLongitude: -49.6401091,
    })

    await expect(() =>
      sut.execute({
        gymId: 'gym_id',
        userId: 'user_id',
        userLatitude: -27.2092052,
        userLongitude: -49.6401091,
      }),
    ).rejects.toBeInstanceOf(MaxNumberOfCheckInsError)
  })

  it('Should not be able to check in twice but in different days', async () => {
    vi.setSystemTime(new Date(2024, 1, 21, 8, 0, 0))

    await sut.execute({
      gymId: 'gym_id',
      userId: 'user_id',
      userLatitude: -27.2092052,
      userLongitude: -49.6401091,
    })

    vi.setSystemTime(new Date(2024, 1, 22, 8, 0, 0))

    const { checkIn } = await sut.execute({
      gymId: 'gym_id',
      userId: 'user_id',
      userLatitude: -27.2092052,
      userLongitude: -49.6401091,
    })

    expect(checkIn.id).toEqual(expect.any(String))
  })
})
