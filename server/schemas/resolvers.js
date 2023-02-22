const { User } = require('../models');
const { signToken } = require('../utils/auth');
const { AuthenticationError } = require('apollo-server-express');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password');
                return userData;
            }
            throw new AuthenticationError('Not logged in');
        },
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Email or Password is incorrect');
            }
            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Email or Password is incorrect');
            }

            const token = signToken(user);
            return { token, user };
        },
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, { input }, { user }) => {
            if (user) {
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: user._id },
                    { $addToSet: { savedBooks: input } },
                    { new: true, runValidators: true }
                );
                return updatedUser;
            }
            throw new AuthenticationError('You must be logged in!');
        },
        removeBook: async (parent, { bookId }, { user }) => {
            if (user) {
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: user._id },
                    { $pull: { savedBooks: { bookId: bookId } } },
                    { new: true, runValidators: true }
                );
                return updatedUser;
            }
            throw new AuthenticationError('You must be logged in!');
        }
    }
};

module.exports = resolvers;