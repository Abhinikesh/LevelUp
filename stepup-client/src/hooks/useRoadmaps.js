import { useState, useCallback } from 'react'
import { roadmapApi, levelApi } from '../api/client'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'

export function useRoadmaps() {
  const {
    roadmaps,
    activeRoadmap,
    levels,
    setRoadmaps,
    setActiveRoadmap,
    setLevels,
    updateLevel,
    updateRoadmap,
    addRoadmap,
    removeRoadmap,
  } = useStore()

  const [loading, setLoading]           = useState(false)
  const [levelsLoading, setLevelsLoading] = useState(false)
  const [error, setError]               = useState(null)

  // ── Fetch all roadmaps ─────────────────────────────────────────
  const fetchRoadmaps = useCallback(async (autoSelectId = null) => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await roadmapApi.getAll()
      const list = data.roadmaps || []
      setRoadmaps(list)

      if (list.length > 0) {
        const target = autoSelectId
          ? list.find((r) => r._id === autoSelectId) || list[0]
          : list[0]
        setActiveRoadmap(target)
        await fetchLevels(target._id)
      } else {
        setActiveRoadmap(null)
        setLevels([])
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load roadmaps')
      toast.error('Failed to load your roadmaps.')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  // ── Fetch levels for a roadmap ─────────────────────────────────
  const fetchLevels = useCallback(async (roadmapId) => {
    try {
      setLevelsLoading(true)
      const { data } = await levelApi.getByRoadmap(roadmapId)
      setLevels(data.levels || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load levels.')
    } finally {
      setLevelsLoading(false)
    }
  }, []) // eslint-disable-line

  // ── Select a roadmap ──────────────────────────────────────────
  const selectRoadmap = useCallback(async (roadmap) => {
    setActiveRoadmap(roadmap)
    await fetchLevels(roadmap._id)
  }, [fetchLevels, setActiveRoadmap])

  // ── Create roadmap ────────────────────────────────────────────
  const createRoadmap = useCallback(async (payload) => {
    try {
      const { data } = await roadmapApi.create(payload)
      addRoadmap(data.roadmap)
      toast.success(data.message || 'Campaign created!')
      return data.roadmap
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to create campaign.')
      throw err
    }
  }, [addRoadmap])

  // ── Delete roadmap ────────────────────────────────────────────
  const deleteRoadmap = useCallback(async (id) => {
    try {
      await roadmapApi.remove(id)
      removeRoadmap(id)
      toast.success('Campaign removed.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete campaign.')
      throw err
    }
  }, [removeRoadmap])

  // ── Complete a level ──────────────────────────────────────────
  const completeLevel = useCallback(async (level, proofData) => {
    const { data } = await levelApi.complete(level._id, proofData)

    // Mark level as done
    updateLevel(level._id, { isCompleted: true, completedAt: new Date() })

    // Unlock next
    const nextLevel = levels.find(
      (l) => l.levelNumber === level.levelNumber + 1
    )
    if (nextLevel) {
      updateLevel(nextLevel._id, { isLocked: false })
    }

    // Update roadmap progress counters
    if (data.roadmap) {
      updateRoadmap(activeRoadmap._id, {
        currentLevel: data.roadmap.currentLevel,
        isCompleted: data.roadmap.isCompleted,
      })
    }

    return data
  }, [levels, activeRoadmap, updateLevel, updateRoadmap])

  return {
    roadmaps,
    activeRoadmap,
    levels,
    loading,
    levelsLoading,
    error,
    fetchRoadmaps,
    fetchLevels,
    selectRoadmap,
    createRoadmap,
    deleteRoadmap,
    completeLevel,
  }
}

export default useRoadmaps
