import projectModel from '../models/project.model.js';
import userModel from '../models/user.model.js';
import mongoose from 'mongoose';

export const createProject = async ({
    name, userId
}) => {
    if (!name) {
        throw new Error('Name is required')
    }
    if (!userId) {
        throw new Error('UserId is required')
    }

    let project;
    try {
        project = await projectModel.create({
            name,
            users: [ userId ]
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('Project name already exists');
        }
        throw error;
    }

    return project;

}


export const getAllProjectByUserId = async ({ userId }) => {
    if (!userId) {
        throw new Error('UserId is required')
    }

    const allUserProjects = await projectModel.find({
        users: userId
    })

    return allUserProjects
}

export const addUsersToProject = async ({ projectId, users, userId }) => {

    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!users) {
        throw new Error("users are required")
    }

    if (!Array.isArray(users) || users.some(userId => !mongoose.Types.ObjectId.isValid(userId))) {
        throw new Error("Invalid userId(s) in users array")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid userId")
    }

    // Validate that all users in the array actually exist in the database
    const existingUsers = await userModel.find({
        _id: { $in: users }
    });

    if (existingUsers.length !== users.length) {
        const existingUserIds = existingUsers.map(user => user._id.toString());
        const nonExistentUserIds = users.filter(userId => !existingUserIds.includes(userId));
        throw new Error(`Users with IDs [${nonExistentUserIds.join(', ')}] do not exist`);
    }

    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    })

    console.log(project)

    if (!project) {
        throw new Error("User not belong to this project")
    }

    const updatedProject = await projectModel.findOneAndUpdate({
        _id: projectId
    }, {
        $addToSet: {
            users: {
                $each: users
            }
        }
    }, {
        new: true
    })

    return updatedProject



}


export const getProjectById = async ({ projectId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    const project = await projectModel.findOne({
        _id: projectId
    }).populate('users')

    return project;
}

export const updateFileTree = async ({ projectId, fileTree }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!fileTree) {
        throw new Error("fileTree is required")
    }

    const project = await projectModel.findOneAndUpdate({
        _id: projectId
    }, {
        fileTree
    }, {
        new: true
    })

    return project;
}

export const removeUsersFromProject = async ({ projectId, users, userId }) => {

    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!users) {
        throw new Error("users are required")
    }

    if (!Array.isArray(users) || users.some(userId => !mongoose.Types.ObjectId.isValid(userId))) {
        throw new Error("Invalid userId(s) in users array")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid userId")
    }

    // Validate that all users in the array actually exist in the database
    const existingUsers = await userModel.find({
        _id: { $in: users }
    });

    if (existingUsers.length !== users.length) {
        const existingUserIds = existingUsers.map(user => user._id.toString());
        const nonExistentUserIds = users.filter(userId => !existingUserIds.includes(userId));
        throw new Error(`Users with IDs [${nonExistentUserIds.join(', ')}] do not exist`);
    }

    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    })

    if (!project) {
        throw new Error("User not belong to this project")
    }

    // Check if trying to remove the project owner (first user in the array)
    const projectOwner = project.users[0];
    if (users.includes(projectOwner.toString())) {
        throw new Error("Cannot remove the project owner")
    }

    const updatedProject = await projectModel.findOneAndUpdate({
        _id: projectId
    }, {
        $pull: {
            users: {
                $in: users
            }
        }
    }, {
        new: true
    })

    return updatedProject
}









export const deleteProject = async ({ projectId, userId }) => {
    if (!projectId) {
        throw new Error('projectId is required')
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid projectId')
    }

    if (!userId) {
        throw new Error('userId is required')
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid userId')
    }

    const project = await projectModel.findById(projectId)
    if (!project) {
        throw new Error('Project not found')
    }

    const ownerId = project.users?.[0]?.toString()
    if (!ownerId || ownerId !== userId.toString()) {
        throw new Error('Only the project owner can delete the project')
    }

    await projectModel.deleteOne({ _id: projectId })

    return { success: true }
}